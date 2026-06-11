// Fitverse AI Controller
// Proxies Fitverse AI requests with server-side API key

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError } = require('../utils/errors');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');
const { cloudinary } = require('../config/cloudinary');
const config = require('../config/env');

const RESULT_CACHE_TTL_MS = 1000 * 60 * 60 * 48;
const resultCache = new Map();
const FORBIDDEN_TERMS = [/fitroom/gi, /fitrrom/gi];
const STRIP_KEYS = new Set(['download_signed_url', 'signed_url', 'download_url']);

const sanitizeText = (value) => {
  if (!value) return value;
  return FORBIDDEN_TERMS.reduce((acc, pattern) => acc.replace(pattern, 'AI provider'), String(value));
};

const sanitizePayload = (value) => {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map((item) => sanitizePayload(item));
  if (!value || typeof value !== 'object') return value;

  return Object.entries(value).reduce((acc, [key, val]) => {
    if (STRIP_KEYS.has(key)) return acc;
    acc[key] = sanitizePayload(val);
    return acc;
  }, {});
};

const ensureConfig = () => {
  const apiKey = config.fitverseAi?.apiKey || '';
  const baseUrl = (config.fitverseAi?.baseUrl || '').replace(/\/+$/, '');
  if (!apiKey) {
    throw new BadRequestError('Fitverse AI API key is not configured');
  }
  if (!baseUrl) {
    throw new BadRequestError('Fitverse AI base URL is not configured');
  }
  return { apiKey, baseUrl };
};

const toBlob = (file) => new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' });

const postForm = async (path, form) => {
  const { apiKey, baseUrl } = ensureConfig();
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey },
      body: form,
    });
  } catch (error) {
    throw new BadRequestError('Fitverse AI request failed');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new BadRequestError('Fitverse AI request failed');
  }
  return sanitizePayload(data);
};

const getJson = async (path) => {
  const { apiKey, baseUrl } = ensureConfig();
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { 'X-API-KEY': apiKey },
    });
  } catch (error) {
    throw new BadRequestError('Fitverse AI request failed');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new BadRequestError('Fitverse AI request failed');
  }
  return sanitizePayload(data);
};

const getJsonRaw = async (path) => {
  const { apiKey, baseUrl } = ensureConfig();
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { 'X-API-KEY': apiKey },
    });
  } catch (error) {
    throw new BadRequestError('Fitverse AI request failed');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new BadRequestError('Fitverse AI request failed');
  }
  return data;
};

const rememberSignedUrl = (taskId, url) => {
  if (!taskId || !url) return;
  resultCache.set(taskId, { url, expiresAt: Date.now() + RESULT_CACHE_TTL_MS });
};

const readSignedUrl = (taskId) => {
  if (!taskId) return null;
  const entry = resultCache.get(taskId);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    resultCache.delete(taskId);
    return null;
  }
  return entry.url || null;
};

const buildResultUrl = (req, id) => `${req.protocol}://${req.get('host')}/api/fitverse-ai/tryon/${id}/result`;

const getCreditCost = (hdMode) => (hdMode ? 2 : 1);

const getPendingCreditCost = async (userId) => {
  const pending = await prisma.aiUsage.findMany({
    where: { userId, success: null },
    select: { hdMode: true },
  });
  return pending.reduce((sum, item) => sum + getCreditCost(!!item.hdMode), 0);
};

const settleUsage = async (taskId, status) => {
  if (!taskId || !status) return;
  if (status !== 'COMPLETED' && status !== 'FAILED') return;

  const usage = await prisma.aiUsage.findUnique({ where: { taskId } });
  if (!usage || usage.success !== null) return;

  if (status === 'FAILED') {
    await prisma.aiUsage.update({ where: { taskId }, data: { success: false } });
    return;
  }

  const cost = getCreditCost(usage.hdMode);
  await prisma.$transaction(async (tx) => {
    const current = await tx.aiUsage.findUnique({ where: { taskId } });
    if (!current || current.success !== null) return;

    await tx.aiUsage.update({ where: { taskId }, data: { success: true } });
    await tx.user.update({
      where: { id: usage.userId },
      data: {
        aiCredits: { decrement: cost },
        aiTryOnCount: { increment: 1 },
      },
    });
  });
};

const uploadModelImage = async (file, userId) => {
  if (cloudinary) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'fitverse/models',
          resource_type: 'image',
          type: 'authenticated', // 🔒 Makes the image private on Cloudinary
        },
        (error, res) => (error ? reject(error) : resolve(res))
      );
      stream.end(file.buffer);
    });
    // 🔒 Strip the /s--...--/ signature out of the URL before saving to DB
    let finalUrl = result.secure_url || result.url;
    finalUrl = finalUrl.replace(/\/s--[a-zA-Z0-9_-]+--\//, '/');
    return finalUrl;
  }

  // 🔒 Local fallback: Save to a non-public directory (not the static 'uploads' folder)
  const uploadDir = path.resolve(__dirname, '../../private_uploads/models');
  fs.mkdirSync(uploadDir, { recursive: true });
  const ext = path.extname(file.originalname || '.jpg').toLowerCase() || '.jpg';
  const filename = `model-${userId}-${Date.now()}${ext}`;
  const fullPath = path.join(uploadDir, filename);
  fs.writeFileSync(fullPath, file.buffer);
  return `/private_uploads/models/${filename}`;
};

const checkModel = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('Model image is required');
  }

  const form = new FormData();
  form.append('input_image', toBlob(req.file), req.file.originalname || 'model.jpg');

  const data = await postForm('/tryon/input_check/v1/model', form);
  return ApiResponse.success(res, 200, data, 'Model check complete');
});

const createModel = asyncHandler(async (req, res) => {
  const nameRaw = String(req.body?.name || '').trim();
  const genderRaw = String(req.body?.gender || '').trim().toUpperCase();

  if (!nameRaw) {
    throw new BadRequestError('Model name is required');
  }
  if (!genderRaw || !['MALE', 'FEMALE', 'OTHER'].includes(genderRaw)) {
    throw new BadRequestError('Model gender is required');
  }

  if (!req.file) {
    throw new BadRequestError('Model image is required');
  }

  const form = new FormData();
  form.append('input_image', toBlob(req.file), req.file.originalname || 'model.jpg');

  const check = await postForm('/tryon/input_check/v1/model', form);
  if (!check?.is_good) {
    return ApiResponse.success(res, 200, { check, model: null }, 'Model rejected');
  }

  const rawImageUrl = await uploadModelImage(req.file, req.user.id);
  const model = await prisma.aiModel.create({
    data: {
      userId: req.user.id,
      name: nameRaw,
      gender: genderRaw,
      imageUrl: rawImageUrl,
      status: 'VERIFIED',
      goodClothesTypes: check.good_clothes_types || [],
      note: check.error_code || null,
    },
  });

  // Return secure proxy URL instead of raw Cloudinary URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const secureModel = {
    ...model,
    imageUrl: `${baseUrl}/api/fitverse-ai/models/${model.id}/image`,
  };

  return ApiResponse.success(res, 201, { check, model: secureModel }, 'Model saved');
});

const checkClothes = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('Clothing image is required');
  }

  const form = new FormData();
  form.append('input_image', toBlob(req.file), req.file.originalname || 'clothes.jpg');

  const data = await postForm('/tryon/input_check/v1/clothes', form);
  return ApiResponse.success(res, 200, data, 'Clothes check complete');
});

const listModels = asyncHandler(async (req, res) => {
  const models = await prisma.aiModel.findMany({
    where: { userId: req.user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  // Map over models to replace the real URL with the secure proxy
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const secureModels = models.map((model) => ({
    ...model,
    imageUrl: `${baseUrl}/api/fitverse-ai/models/${model.id}/image`,
  }));

  return ApiResponse.success(res, 200, secureModels, 'Models retrieved');
});

const deleteModel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new BadRequestError('Model id is required');

  await prisma.aiModel.updateMany({
    where: { id, userId: req.user.id },
    data: { isActive: false },
  });

  return ApiResponse.success(res, 200, null, 'Model removed');
});

const createTryOn = asyncHandler(async (req, res) => {
  const { cloth_type, hd_mode } = req.body;
  const files = req.files || {};
  const modelFile = files.model_image?.[0];
  const clothFile = files.cloth_image?.[0];
  const lowerFile = files.lower_cloth_image?.[0];

  if (!modelFile) {
    throw new BadRequestError('Model image is required');
  }
  if (!cloth_type) {
    throw new BadRequestError('cloth_type is required');
  }

  if (cloth_type === 'combo') {
    if (!clothFile || !lowerFile) {
      throw new BadRequestError('Upper and lower clothing images are required for combo try-on');
    }
  } else if (!clothFile) {
    throw new BadRequestError('Clothing image is required');
  }

  const creditCost = getCreditCost(hd_mode === 'true');
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { aiCredits: true },
  });
  if (!user) {
    throw new BadRequestError('User not found');
  }

  const pendingCost = await getPendingCreditCost(req.user.id);
  if (user.aiCredits - pendingCost < creditCost) {
    throw new BadRequestError('Insufficient AI credits');
  }

  const form = new FormData();
  form.append('cloth_type', cloth_type);
  if (hd_mode === 'true') {
    form.append('hd_mode', 'true');
  }

  form.append('model_image', toBlob(modelFile), modelFile.originalname || 'model.jpg');
  form.append('cloth_image', toBlob(clothFile), clothFile?.originalname || 'cloth.jpg');
  if (lowerFile) {
    form.append('lower_cloth_image', toBlob(lowerFile), lowerFile.originalname || 'lower.jpg');
  }

  const data = await postForm('/tryon/v2/tasks', form);

  if (data?.task_id) {
    await prisma.aiUsage.create({
      data: {
        userId: req.user.id,
        taskId: data.task_id,
        hdMode: hd_mode === 'true',
      },
    });
  }

  return ApiResponse.success(res, 200, data, 'Try-on task created');
});

const getTryOnStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError('Task id is required');
  }

  const data = await getJsonRaw(`/tryon/v2/tasks/${id}`);
  const payload = {
    task_id: data?.task_id || id,
    status: data?.status,
    progress: data?.progress,
    error: sanitizeText(data?.error),
    created_at: data?.created_at,
    started_at: data?.started_at,
    completed_at: data?.completed_at,
  };

  if (data?.status === 'COMPLETED') {
    if (data?.download_signed_url) {
      rememberSignedUrl(id, data.download_signed_url);
    }
    payload.result_url = buildResultUrl(req, id);
  }

  if (data?.status === 'FAILED') {
    await settleUsage(id, data?.status);
  }

  return ApiResponse.success(res, 200, payload, 'Try-on task status');
});

const getTryOnResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError('Task id is required');
  }
  const fetchResultBuffer = async (url) => {
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return { buffer, contentType };
  };

  let signedUrl = readSignedUrl(id);
  let result = await fetchResultBuffer(signedUrl);

  if (!result) {
    resultCache.delete(id);
    const data = await getJsonRaw(`/tryon/v2/tasks/${id}`);
    if (data?.status === 'FAILED') {
      await settleUsage(id, 'FAILED');
      throw new BadRequestError('Try-on failed');
    }
    if (data?.status !== 'COMPLETED' || !data?.download_signed_url) {
      throw new BadRequestError('Result is not ready');
    }
    signedUrl = data.download_signed_url;
    rememberSignedUrl(id, signedUrl);
    result = await fetchResultBuffer(signedUrl);
  }

  if (!result) {
    await settleUsage(id, 'FAILED');
    throw new BadRequestError('Failed to fetch result image');
  }

  await settleUsage(id, 'COMPLETED');
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(result.buffer);
});

const getModelImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Support token via query param for <img> tags that can't set Authorization header
  let userId = req.user?.id;
  if (!userId && req.query.token) {
    try {
      const jwt = require('jsonwebtoken');
      const jwtConfig = require('../config/env');
      const decoded = jwt.verify(req.query.token, jwtConfig.jwt.secret);
      userId = decoded.id;
    } catch (e) {
      throw new BadRequestError('Invalid or expired token');
    }
  }

  if (!userId) {
    throw new BadRequestError('Authentication required');
  }

  // 1. Verify the model belongs to the requesting user
  const model = await prisma.aiModel.findFirst({
    where: { id, userId },
  });

  if (!model) {
    throw new BadRequestError('Model not found or access denied');
  }

  // 2. Strip any lingering signature from stored URL (safety check — for old models uploaded before the fix)
  const cleanStoredUrl = String(model.imageUrl).replace(/\/s--[a-zA-Z0-9_-]+--\//, '/');
  const imageUrl = cleanStoredUrl;

  // 3. Extract public_id from the clean Cloudinary URL
  let publicId = null;
  if (imageUrl.startsWith('http')) {
    const parts = imageUrl.split('/');
    const authIdx = parts.findIndex(p => p === 'upload' || p === 'authenticated');
    if (authIdx !== -1) {
      const afterType = parts.slice(authIdx + 1);
      const versionIdx = afterType.findIndex(p => /^v\d+$/.test(p));
      const startIdx = versionIdx !== -1 ? versionIdx + 1 : 0;
      publicId = afterType.slice(startIdx).join('/').replace(/\.[a-zA-Z0-9]+$/, '');
    }
  }

  // 4. Handle Cloudinary Image — redirect to a short-lived signed URL
  if (imageUrl.startsWith('http')) {
    if (!cloudinary) {
      throw new BadRequestError('Cloudinary not configured');
    }

    if (!publicId) throw new BadRequestError('Invalid image reference');

    // 🔐 Generate a short-lived signed URL (valid for 1 hour)
    // The signature is created server-side using CLOUDINARY_API_SECRET
    const signedUrl = cloudinary.url(publicId, {
      type: 'authenticated',
      secure: true,
      sign_url: true,
      resource_type: 'image',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    // 302 redirect — browser fetches directly from Cloudinary with the signed URL
    return res.redirect(signedUrl);
  }

  // 5. Handle Local Fallback Image
  if (imageUrl.startsWith('/private_uploads/') || imageUrl.startsWith('/uploads/models/')) {
    const localPath = path.resolve(__dirname, '../../', imageUrl.replace(/^\//, ''));
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }
  }

  throw new BadRequestError('Image file not found');
});

module.exports = {
  checkModel,
  createModel,
  listModels,
  deleteModel,
  checkClothes,
  createTryOn,
  getTryOnStatus,
  getTryOnResult,
  getModelImage,
};
