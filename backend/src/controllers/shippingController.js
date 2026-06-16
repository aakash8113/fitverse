// Shipping Controller — Shiprocket Integration
// Handles sending orders to Shiprocket, webhooks, shipping management, and admin assignment

const prisma = require('../config/database');
const shippingService = require('../services/shippingService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

/**
 * POST /api/shipping/mark-admin-shipment
 * Admin marks an order as self-managed (not Shiprocket).
 * This simply sets shippingMethod = 'ADMIN' so the admin can manage status via dropdown.
 */
const markAsAdminShipment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) throw new BadRequestError('orderId is required');

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');

  if (order.shippingMethod) {
    throw new BadRequestError(`Order already has a shipping method: ${order.shippingMethod}`);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { shippingMethod: 'ADMIN' },
  });

  return ApiResponse.success(res, 200, updated, 'Order marked as admin-managed shipment');
});

/**
 * POST /api/shipping/check-serviceability
 * Check if Shiprocket couriers can deliver to a pincode.
 * Body: { deliveryPincode, weight?, cod? }
 */
const checkServiceability = asyncHandler(async (req, res) => {
  const { deliveryPincode, weight, cod } = req.body;

  if (!deliveryPincode) {
    throw new BadRequestError('deliveryPincode is required');
  }

  const result = await shippingService.checkServiceability({
    deliveryPincode,
    weight: weight || 0.5,
    cod: cod || false,
  });

  return ApiResponse.success(res, 200, result, 'Serviceability check completed');
});

/**
 * POST /api/shipping/send-to-shiprocket/:orderId
 * Admin sends an order to Shiprocket for fulfillment.
 * The wrapper API handles order creation, AWB generation, label, and pickup scheduling.
 */
const sendToShiprocket = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { weight, length, breadth, height, courierId } = req.body;

  // Fetch order with all details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sellerId: true,
              weight: true,
              length: true,
              breadth: true,
              height: true,
            },
          },
        },
      },
      address: true,
      user: {
        select: { name: true, email: true, phone: true },
      },
    },
  });

  if (!order) throw new NotFoundError('Order not found');
  if (order.status !== 'PROCESSING') {
    throw new BadRequestError(`Cannot send order with status: ${order.status}`);
  }
  if (order.shippingMethod === 'SHIPROCKET') {
    throw new BadRequestError('Order is already being handled by Shiprocket');
  }

  const address = order.address;
  if (!address) throw new BadRequestError('Order has no delivery address');

  // ── Check seller pickup addresses ──────────────────────────────────
  // Group items by seller
  const sellerItems = {};
  for (const item of order.orderItems) {
    const sellerId = item.product?.sellerId;
    if (sellerId) {
      if (!sellerItems[sellerId]) sellerItems[sellerId] = [];
      sellerItems[sellerId].push(item);
    }
  }

  // Get seller pickup addresses
  const sellerIds = Object.keys(sellerItems);
  let pickupLocation = null;
  let pickupAddressData = null;

  if (sellerIds.length > 0) {
    // For seller products, get the first seller's default pickup address
    const firstSellerId = sellerIds[0];
    const pickupAddress = await prisma.pickupAddress.findFirst({
      where: { sellerId: firstSellerId, isDefault: true, isActive: true },
    });
    if (!pickupAddress) {
      throw new BadRequestError(
        `Seller does not have a default pickup address configured. Please set up a pickup address first.`
      );
    }
    // Use the pickup location name
    pickupLocation = pickupAddress.name;
    // Pass pickup address data so Shiprocket auto-creates the pickup via vendor_details
    pickupAddressData = {
      email: pickupAddress.email,
      phone: pickupAddress.phone,
      name: pickupAddress.companyName || pickupAddress.name,
      address: pickupAddress.address,
      address2: pickupAddress.address2 || '',
      city: pickupAddress.city,
      state: pickupAddress.state,
      country: 'India',
      pincode: pickupAddress.pincode,
    };

    // Shiprocket requires address to have house/road numbers (min 10 chars)
    if (pickupAddress.address.length < 10) {
      pickupAddressData.address = `${pickupAddress.address}, ${pickupAddress.city}, ${pickupAddress.state}`;
    }
  } else {
    // Admin products — use default admin pickup location
    throw new BadRequestError('This order contains only admin products. No admin pickup location configured.');
  }

  // ── Calculate total weight and dimensions ──────────────────────────
  const totalWeight = weight || order.orderItems.reduce((sum, item) => {
    const catDims = shippingService.getCategoryDimensions(item.product?.category);
    const itemWeight = item.product?.weight ? parseFloat(item.product.weight.toString()) : catDims.weight;
    return sum + (itemWeight / 1000) * item.quantity;
  }, 0);

  let maxLength = 0, maxBreadth = 0, maxHeight = 0;
  if (length && breadth && height) {
    maxLength = length;
    maxBreadth = breadth;
    maxHeight = height;
  } else {
    for (const item of order.orderItems) {
      const catDims = shippingService.getCategoryDimensions(item.product?.category);
      const pl = item.product?.length ? parseFloat(item.product.length.toString()) : catDims.length;
      const pb = item.product?.breadth ? parseFloat(item.product.breadth.toString()) : catDims.breadth;
      const ph = item.product?.height ? parseFloat(item.product.height.toString()) : catDims.height;
      if (pl > maxLength) maxLength = pl;
      if (pb > maxBreadth) maxBreadth = pb;
      if (ph > maxHeight) maxHeight = ph;
    }
    maxHeight = maxHeight * Math.max(1, Math.ceil(order.orderItems.length / 3));
  }

  // ── Map payment method ─────────────────────────────────────────────
  const isCOD = order.paymentMethod === 'COD';
  const paymentMethod = isCOD ? 'COD' : 'Prepaid';

  // ── Create shipment on Shiprocket ──────────────────────────────────
  const orderDate = order.createdAt.toISOString().split('T')[0];

  const billingInfo = {
    name: address.name,
    address: address.addressLine1,
    city: address.city,
    state: address.state,
    country: address.country || 'India',
    pincode: address.zipCode,
    email: order.user.email,
    phone: address.phone || order.user.phone || '',
  };

  const shipmentResult = await shippingService.createShipment({
    orderId: order.orderNumber,
    orderDate,
    billing: billingInfo,
    shipping: null,
    items: order.orderItems.map((item) => ({
      name: item.productName,
      sku: item.productId || item.productName,
      units: item.quantity,
      selling_price: Math.round(parseFloat(item.price.toString())),
      hsn: '',
    })),
    paymentMethod,
    subTotal: Math.round(parseFloat(order.subtotal.toString())),
    total: Math.round(parseFloat(order.total.toString())),
    weight: Math.max(0.5, totalWeight),
    length: Math.max(10, maxLength),
    breadth: Math.max(10, maxBreadth),
    height: Math.max(1, maxHeight),
    pickupLocation,
    pickupAddress: pickupAddressData,
    courierId: courierId || undefined,
  });

  // ── Update order with Shiprocket details ─────────────────────────
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      shippingMethod: 'SHIPROCKET',
      shiprocketOrderId: String(shipmentResult.shiprocketOrderId),
      shipmentId: String(shipmentResult.shipmentId),
      awbCode: shipmentResult.awbCode,
      courierId: shipmentResult.courierId ? String(shipmentResult.courierId) : null,
      courierName: shipmentResult.courierName,
      labelUrl: shipmentResult.labelUrl,
      manifestUrl: shipmentResult.manifestUrl,
      trackingUrl: shipmentResult.awbCode
        ? `https://shiprocket.co/tracking/${shipmentResult.awbCode}`
        : null,
      pickupScheduledAt: shipmentResult.pickupScheduledDate
        ? new Date(shipmentResult.pickupScheduledDate)
        : null,
    },
  });

  logger.info(`Order ${order.orderNumber} sent to Shiprocket | AWB: ${shipmentResult.awbCode}`);

  return ApiResponse.success(res, 200, {
    order: updatedOrder,
    shipment: shipmentResult,
  }, 'Order sent to Shiprocket successfully');
});

/**
 * POST /api/shipping/webhook
 * Shiprocket S2S webhook callback for tracking updates.
 * Responds 200 immediately, processes updates asynchronously.
 */
const handleWebhook = async (req, res) => {
  res.status(200).json({ success: true });

  try {
    const authorization = req.headers['x-api-key'] || '';
    const body = req.body;

    const isValid = shippingService.validateWebhook(authorization, body);
    if (!isValid) {
      logger.warn('Shiprocket webhook validation failed');
      return;
    }

    const { awb, order_id, current_status, current_status_id, shipment_status, scans } = body;

    logger.info(`Shiprocket webhook | AWB=${awb} | status=${current_status} (${current_status_id})`);

    const order = await prisma.order.findFirst({
      where: { awbCode: awb },
    });

    if (!order) {
      logger.warn(`Shiprocket webhook: no order found for AWB ${awb}`);
      return;
    }

    const mappedStatus = shippingService.mapWebhookStatus(current_status, current_status_id);
    if (!mappedStatus) {
      logger.debug(`Shiprocket webhook: unmapped status ${current_status} (${current_status_id}) for order ${order.orderNumber}`);
      return;
    }

    const updateData = { status: mappedStatus };
    if (mappedStatus === 'SHIPPED' && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (mappedStatus === 'DELIVERED' && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }
    if (mappedStatus === 'CANCELLED' && !order.cancelledAt) {
      updateData.cancelledAt = new Date();
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    logger.info(`Shiprocket webhook: order ${order.orderNumber} status updated to ${mappedStatus}`);
  } catch (error) {
    logger.error(`Shiprocket webhook processing error: ${error.message}`);
  }
};

/**
 * GET /api/shipping/track/:awbCode
 * Track a shipment by AWB code.
 */
const trackShipment = asyncHandler(async (req, res) => {
  const { awbCode } = req.params;
  if (!awbCode) throw new BadRequestError('AWB code is required');

  const data = await shippingService.trackShipment(awbCode);
  return ApiResponse.success(res, 200, data, 'Tracking data retrieved');
});

/**
 * POST /api/shipping/generate-label/:orderId
 * Generate a label for an already-shipped order.
 */
const generateLabel = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');
  if (!order.shipmentId) throw new BadRequestError('Order has no Shiprocket shipment ID');

  const result = await shippingService.generateLabel({ shipmentId: Number(order.shipmentId) });

  if (result.labelUrl) {
    await prisma.order.update({
      where: { id: orderId },
      data: { labelUrl: result.labelUrl },
    });
  }

  return ApiResponse.success(res, 200, result, 'Label generated');
});

/**
 * POST /api/shipping/cancel/:orderId
 * Cancel a Shiprocket shipment for an order.
 */
const cancelShiprocketShipment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');
  if (order.shippingMethod !== 'SHIPROCKET') {
    throw new BadRequestError('Order is not shipped via Shiprocket');
  }
  if (!order.awbCode) throw new BadRequestError('No AWB code found for this order');

  await shippingService.cancelShipment(order.awbCode);

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  return ApiResponse.success(res, 200, null, 'Shiprocket shipment cancelled');
});

module.exports = {
  checkServiceability,
  sendToShiprocket,
  handleWebhook,
  trackShipment,
  generateLabel,
  cancelShiprocketShipment,
  markAsAdminShipment,
};