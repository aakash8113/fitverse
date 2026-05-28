// AI Credits Controller
// Handles credit balance, purchases, and PhonePe checkout

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const prisma = require('../config/database');
const paymentService = require('../services/paymentService');
const config = require('../config/env');
const logger = require('../config/logger');

const CREDIT_PACKS = [
  { id: 'pack_10', credits: 10, amountInPaise: 19900, label: '10 Credits', subtitle: 'Starter pack' },
  { id: 'pack_25', credits: 25, amountInPaise: 39900, label: '25 Credits', subtitle: 'Most popular' },
  { id: 'pack_50', credits: 50, amountInPaise: 69900, label: '50 Credits', subtitle: 'Best value' },
];

const findPack = (id) => CREDIT_PACKS.find((pack) => pack.id === id);

const completePurchase = async (purchaseId, phonePeOrderId) => {
  const purchase = await prisma.aiCreditPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return null;
  if (purchase.status === 'COMPLETED') return purchase;

  return prisma.$transaction(async (tx) => {
    const fresh = await tx.aiCreditPurchase.findUnique({ where: { id: purchaseId } });
    if (!fresh || fresh.status === 'COMPLETED') return fresh;

    const updated = await tx.aiCreditPurchase.update({
      where: { id: purchaseId },
      data: {
        status: 'COMPLETED',
        phonePeOrderId: phonePeOrderId || fresh.phonePeOrderId,
      },
    });

    await tx.user.update({
      where: { id: updated.userId },
      data: { aiCredits: { increment: updated.credits } },
    });

    return updated;
  });
};

const failPurchase = async (purchaseId) => {
  const purchase = await prisma.aiCreditPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return null;
  if (purchase.status !== 'PENDING') return purchase;

  return prisma.aiCreditPurchase.update({
    where: { id: purchaseId },
    data: { status: 'FAILED' },
  });
};

/**
 * GET /api/credits/packs
 */
const listCreditPacks = asyncHandler(async (_req, res) => {
  const packs = CREDIT_PACKS.map((pack) => ({
    id: pack.id,
    credits: pack.credits,
    amountInPaise: pack.amountInPaise,
    amount: pack.amountInPaise / 100,
    label: pack.label,
    subtitle: pack.subtitle,
  }));

  return ApiResponse.success(res, 200, packs, 'Credit packs retrieved');
});

/**
 * GET /api/credits/balance
 */
const getCreditBalance = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { aiCredits: true, aiTryOnCount: true },
  });

  if (!user) throw new NotFoundError('User not found');

  return ApiResponse.success(res, 200, user, 'AI credits retrieved');
});

/**
 * GET /api/credits/purchases
 */
const getPurchaseHistory = asyncHandler(async (req, res) => {
  const purchases = await prisma.aiCreditPurchase.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return ApiResponse.success(res, 200, purchases, 'Credit purchase history');
});

/**
 * POST /api/credits/purchase/initiate
 * Body: { packId }
 */
const initiateCreditPurchase = asyncHandler(async (req, res) => {
  const packId = String(req.body?.packId || '').trim();
  const pack = findPack(packId);
  if (!pack) {
    throw new BadRequestError('Invalid credit pack');
  }

  const purchase = await prisma.aiCreditPurchase.create({
    data: {
      userId: req.user.id,
      credits: pack.credits,
      amountInPaise: pack.amountInPaise,
      status: 'PENDING',
    },
  });

  const redirectUrl = `${config.frontend.primaryUrl}/credits/return?purchaseId=${purchase.id}`;

  let paymentResponse;
  try {
    paymentResponse = await paymentService.initiatePayment({
      merchantOrderId: purchase.id,
      amountInPaise: pack.amountInPaise,
      redirectUrl,
      metaInfo: {
        udf1: req.user.id,
        udf2: pack.id,
      },
    });
  } catch (error) {
    await prisma.aiCreditPurchase.update({
      where: { id: purchase.id },
      data: { status: 'FAILED' },
    });
    throw error;
  }

  await prisma.aiCreditPurchase.update({
    where: { id: purchase.id },
    data: { phonePeOrderId: paymentResponse.phonePeOrderId },
  });

  return ApiResponse.success(
    res,
    200,
    {
      purchaseId: purchase.id,
      credits: pack.credits,
      amount: pack.amountInPaise / 100,
      redirectUrl: paymentResponse.redirectUrl,
      phonePeOrderId: paymentResponse.phonePeOrderId,
      expireAt: paymentResponse.expireAt,
    },
    'Credit purchase initiated'
  );
});

/**
 * GET /api/credits/purchase/status/:purchaseId
 */
const getPurchaseStatus = asyncHandler(async (req, res) => {
  const { purchaseId } = req.params;
  const purchase = await prisma.aiCreditPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase || purchase.userId !== req.user.id) {
    throw new NotFoundError('Purchase not found');
  }

  if (purchase.status === 'PENDING') {
    try {
      const phonePeStatus = await paymentService.getOrderStatus(purchase.id);
      if (phonePeStatus.state === 'COMPLETED') {
        await completePurchase(purchase.id, phonePeStatus.orderId);
      } else if (phonePeStatus.state === 'FAILED') {
        await failPurchase(purchase.id);
      }
    } catch (error) {
      logger.warn(`PhonePe credit status poll failed for ${purchase.id}: ${error.message}`);
    }
  }

  const fresh = await prisma.aiCreditPurchase.findUnique({ where: { id: purchaseId } });
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { aiCredits: true },
  });

  return ApiResponse.success(
    res,
    200,
    {
      purchase: fresh,
      aiCredits: user?.aiCredits ?? 0,
    },
    'Credit purchase status'
  );
});

/**
 * POST /api/credits/webhook
 */
const handleCreditsWebhook = async (req, res) => {
  res.status(200).json({ success: true });

  try {
    const authorization = req.headers['authorization'] || '';
    const bodyString = req.rawBody || JSON.stringify(req.body);
    const callbackResponse = paymentService.validateWebhook(authorization, bodyString);
    const { state, originalMerchantOrderId, orderId: phonePeOrderId } = callbackResponse.payload;

    logger.info(`PhonePe credits webhook | purchaseId=${originalMerchantOrderId} | state=${state}`);

    if (state === 'COMPLETED') {
      await completePurchase(originalMerchantOrderId, phonePeOrderId);
    } else if (state === 'FAILED') {
      await failPurchase(originalMerchantOrderId);
    }
  } catch (error) {
    logger.error(`PhonePe credits webhook error: ${error.message}`);
  }
};

module.exports = {
  listCreditPacks,
  getCreditBalance,
  getPurchaseHistory,
  initiateCreditPurchase,
  getPurchaseStatus,
  handleCreditsWebhook,
};
