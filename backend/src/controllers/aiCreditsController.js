// AI Credits Controller
// Handles credit balance, purchases, and Razorpay checkout

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const prisma = require('../config/database');
const paymentService = require('../services/paymentService');
const config = require('../config/env');
const logger = require('../config/logger');

const CREDIT_PACKS = [
  { id: 'pack_10', credits: 10, amountInPaise: 6000, label: '10 Credits', subtitle: 'Starter pack' },
  { id: 'pack_50', credits: 50, amountInPaise: 25000, label: '50 Credits', subtitle: 'Most popular' },
  { id: 'pack_100', credits: 100, amountInPaise: 45000, label: '100 Credits', subtitle: 'Best value' },
];

const findPack = (id) => CREDIT_PACKS.find((pack) => pack.id === id);

const completePurchase = async (purchaseId, razorpayPaymentId, razorpayOrderId) => {
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
        razorpayPaymentId: razorpayPaymentId || fresh.razorpayPaymentId,
        razorpayOrderId: razorpayOrderId || fresh.razorpayOrderId,
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

  // Create a Razorpay order for the credit purchase
  let razorpayOrder;
  try {
    razorpayOrder = await paymentService.createOrder({
      merchantOrderId: purchase.id,
      amountInPaise: pack.amountInPaise,
      notes: {
        userId: req.user.id,
        packId: pack.id,
        type: 'credit_purchase',
      },
    });
  } catch (error) {
    await prisma.aiCreditPurchase.update({
      where: { id: purchase.id },
      data: { status: 'FAILED' },
    });
    throw error;
  }

  // Store the Razorpay order ID
  await prisma.aiCreditPurchase.update({
    where: { id: purchase.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  return ApiResponse.success(
    res,
    200,
    {
      purchaseId: purchase.id,
      credits: pack.credits,
      amount: pack.amountInPaise / 100,
      razorpayOrderId: razorpayOrder.id,
    },
    'Credit purchase initiated — open Razorpay Checkout'
  );
});

/**
 * POST /api/credits/purchase/verify
 * Body: { purchaseId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 */
const verifyCreditPurchase = asyncHandler(async (req, res) => {
  const { purchaseId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!purchaseId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new BadRequestError('Missing required payment verification fields');
  }

  // Verify the payment signature
  const isValid = paymentService.verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValid) {
    throw new BadRequestError('Payment verification failed — invalid signature');
  }

  // Complete the purchase
  await completePurchase(purchaseId, razorpayPaymentId, razorpayOrderId);

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
    'Credit purchase verified successfully'
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

  if (purchase.status === 'PENDING' && purchase.razorpayOrderId) {
    try {
      const payments = await paymentService.getPaymentsForOrder(purchase.razorpayOrderId);
      const capturedPayment = payments.find(p => p.status === 'captured');
      
      if (capturedPayment) {
        await completePurchase(purchase.id, capturedPayment.id, purchase.razorpayOrderId);
      }
    } catch (error) {
      logger.warn(`Razorpay credit status poll failed for ${purchase.id}: ${error.message}`);
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
 * Razorpay webhook for credits
 */
const handleCreditsWebhook = async (req, res) => {
  res.status(200).json({ success: true });

  try {
    const signature = req.headers['x-razorpay-signature'] || '';
    const bodyString = req.rawBody || JSON.stringify(req.body);

    const isValid = paymentService.validateWebhook(bodyString, signature);
    if (!isValid) {
      logger.warn('Razorpay credits webhook validation failed');
      return;
    }

    const event = req.body;
    logger.info(`Razorpay credits webhook | event=${event.event}`);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      // Find the credit purchase by razorpayOrderId
      const purchase = await prisma.aiCreditPurchase.findFirst({
        where: { razorpayOrderId },
      });

      if (purchase) {
        await completePurchase(purchase.id, razorpayPaymentId, razorpayOrderId);
      } else {
        logger.warn(`Razorpay credits webhook: no purchase found for order ${razorpayOrderId}`);
      }
    } else if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      const purchase = await prisma.aiCreditPurchase.findFirst({
        where: { razorpayOrderId },
      });

      if (purchase) {
        await failPurchase(purchase.id);
      }
    }
  } catch (error) {
    logger.error(`Razorpay credits webhook error: ${error.message}`);
  }
};

module.exports = {
  listCreditPacks,
  getCreditBalance,
  getPurchaseHistory,
  initiateCreditPurchase,
  verifyCreditPurchase,
  getPurchaseStatus,
  handleCreditsWebhook,
};