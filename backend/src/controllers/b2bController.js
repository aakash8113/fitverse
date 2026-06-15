// B2B Controller
// Public API endpoints for business clients — authenticated via API key

const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError } = require('../utils/errors');
const prisma = require('../config/database');
const config = require('../config/env');
const b2bService = require('../services/b2bService');
const { generateApiKey, hashApiKey } = require('../middlewares/businessAuth');

const toBlob = (file) => new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' });

const ensureConfig = () => {
  const apiKey = config.fitverseAi?.apiKey || '';
  const baseUrl = (config.fitverseAi?.baseUrl || '').replace(/\/+$/, '');
  if (!apiKey || !baseUrl) {
    throw new BadRequestError('Fitverse AI API is not configured on the server');
  }
  return { apiKey, baseUrl };
};

const postForm = async (path, form) => {
  const { apiKey, baseUrl } = ensureConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey },
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new BadRequestError(data?.message || 'Fitverse AI request failed');
  return data;
};

const getJson = async (path) => {
  const { apiKey, baseUrl } = ensureConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-API-KEY': apiKey },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new BadRequestError(data?.message || 'Fitverse AI request failed');
  return data;
};

// ── B2B Controller Functions ──────────────────────────────────────────

/**
 * POST /api/v1/tryon
 * Create a try-on task (deducts 1 credit)
 */
const createTryOn = asyncHandler(async (req, res) => {
  const { cloth_type, hd_mode, callback_url } = req.body;
  const files = req.files || {};
  const modelFile = files.model_image?.[0];
  const clothFile = files.cloth_image?.[0];
  const lowerFile = files.lower_cloth_image?.[0];

  if (!modelFile) throw new BadRequestError('model_image is required');
  if (!cloth_type) throw new BadRequestError('cloth_type is required');

  if (cloth_type === 'combo' && (!clothFile || !lowerFile)) {
    throw new BadRequestError('Upper and lower clothing images are required for combo try-on');
  } else if (!clothFile) {
    throw new BadRequestError('cloth_image is required');
  }

  // Deduct credit before processing
  await b2bService.deductCredit(req.business.id);

  const form = new FormData();
  form.append('cloth_type', cloth_type);
  if (hd_mode === 'true') form.append('hd_mode', 'true');

  form.append('model_image', toBlob(modelFile), modelFile.originalname || 'model.jpg');
  form.append('cloth_image', toBlob(clothFile), clothFile?.originalname || 'cloth.jpg');
  if (lowerFile) form.append('lower_cloth_image', toBlob(lowerFile), lowerFile.originalname || 'lower.jpg');

  const data = await postForm('/tryon/v2/tasks', form);

  if (data?.task_id) {
    await prisma.aiUsage.create({
      data: {
        userId: req.business.id,
        taskId: data.task_id,
        hdMode: hd_mode === 'true',
      },
    });
  }

  return ApiResponse.success(res, 200, data, 'Try-on task created');
});

/**
 * GET /api/v1/tryon/:id
 * Poll try-on task status
 */
const getTryOnStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new BadRequestError('Task id is required');

  const data = await getJson(`/tryon/v2/tasks/${id}`);
  return ApiResponse.success(res, 200, {
    task_id: data?.task_id || id,
    status: data?.status,
    progress: data?.progress,
    created_at: data?.created_at,
    started_at: data?.started_at,
    completed_at: data?.completed_at,
    result_url: data?.download_signed_url || null,
  }, 'Task status retrieved');
});

/**
 * POST /api/v1/model/check
 * Verify a model image
 */
const checkModel = asyncHandler(async (req, res) => {
  if (!req.file) throw new BadRequestError('input_image is required');

  const form = new FormData();
  form.append('input_image', toBlob(req.file), req.file.originalname || 'model.jpg');

  const data = await postForm('/tryon/input_check/v1/model', form);
  return ApiResponse.success(res, 200, data, 'Model check complete');
});

/**
 * POST /api/v1/clothes/check
 * Verify a clothing image
 */
const checkClothes = asyncHandler(async (req, res) => {
  if (!req.file) throw new BadRequestError('input_image is required');

  const form = new FormData();
  form.append('input_image', toBlob(req.file), req.file.originalname || 'clothes.jpg');

  const data = await postForm('/tryon/input_check/v1/clothes', form);
  return ApiResponse.success(res, 200, data, 'Clothes check complete');
});

/**
 * GET /api/v1/credits
 * Check remaining credits
 */
const getCredits = asyncHandler(async (req, res) => {
  const balance = await b2bService.getBalance(req.business.id);
  return ApiResponse.success(res, 200, { credits: balance, costPerTask: 1 }, 'Credits retrieved');
});

/**
 * GET /api/v1/usage
 * Get usage history
 */
const getUsage = asyncHandler(async (req, res) => {
  const result = await b2bService.getUsageHistory(req.business.id, req.query);
  return ApiResponse.success(res, 200, result, 'Usage history retrieved');
});

/**
 * GET /api/v1/keys
 * List API keys for dashboard
 */
const getApiKeys = asyncHandler(async (req, res) => {
  const keys = await b2bService.getApiKeys(req.business.id);
  return ApiResponse.success(res, 200, keys, 'API keys retrieved');
});

/**
 * POST /api/v1/keys
 * Create a new API key
 */
const createApiKey = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) throw new BadRequestError('Key name is required');

  const { raw, hash, prefix } = generateApiKey();

  await prisma.businessApiKey.create({
    data: {
      businessId: req.business.id,
      name: name.trim(),
      keyHash: hash,
      keyPrefix: prefix,
    },
  });

  // Return the raw key ONLY on creation
  return ApiResponse.success(res, 201, { key: raw, name: name.trim(), prefix }, 'API key created. Save this key — it will not be shown again.');
});

/**
 * DELETE /api/v1/keys/:id
 * Revoke an API key
 */
const revokeApiKey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.businessApiKey.updateMany({
    where: { id, businessId: req.business.id },
    data: { isActive: false },
  });
  return ApiResponse.success(res, 200, null, 'API key revoked');
});

module.exports = {
  createTryOn,
  getTryOnStatus,
  checkModel,
  checkClothes,
  getCredits,
  getUsage,
  getApiKeys,
  createApiKey,
  revokeApiKey,
};