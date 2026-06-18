// Return & Replacement Service
// Business logic for return/replacement requests

const prisma = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');
const { isSchemaMismatchError } = require('../utils/dbErrors');

const RETURN_WINDOW_DAYS = 3;

// Generate request number like RET20260303001
async function generateRequestNumber() {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RET${datePart}`;
  const count = await prisma.returnRequest.count({
    where: { requestNumber: { startsWith: prefix } },
  });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}

// -----------------------------------------------
// CUSTOMER — create return/replacement request
// -----------------------------------------------
const createReturnRequest = async (userId, body) => {
  const {
    orderId,
    type,
    reason,
    description,
    images,
    replacementSize,
    bankAccountName,
    bankAccountNumber,
    bankIFSC,
    upiHandle,
    items, // [{ orderItemId, quantity }]
  } = body;

  // Fetch order with items
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { orderItems: true },
  });
  if (!order) throw new NotFoundError('Order not found');
  if (order.status !== 'DELIVERED') {
    throw new BadRequestError('Only delivered orders can be returned or replaced');
  }

  // Check return window
  const deliveredAt = order.deliveredAt || order.updatedAt;
  const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > RETURN_WINDOW_DAYS) {
    throw new BadRequestError(`Return window of ${RETURN_WINDOW_DAYS} days has passed`);
  }

  // Check for existing active request on same order
  const existingActive = await prisma.returnRequest.findFirst({
    where: {
      orderId,
      userId,
      status: { in: ['REQUESTED', 'APPROVED', 'ITEM_RECEIVED', 'REFUND_INITIATED', 'REPLACEMENT_SHIPPED'] },
    },
  });
  if (existingActive) {
    throw new BadRequestError('An active return/replacement request already exists for this order');
  }

  // Validate items belong to order
  const orderItemIds = order.orderItems.map((i) => i.id);
  for (const item of items) {
    if (!orderItemIds.includes(item.orderItemId)) {
      throw new BadRequestError(`Order item ${item.orderItemId} does not belong to this order`);
    }
  }

  const requestNumber = await generateRequestNumber();

  const returnRequest = await prisma.returnRequest.create({
    data: {
      requestNumber,
      orderId,
      userId,
      type,
      reason,
      description: description || null,
      images: images || [],
      replacementSize: replacementSize || null,
      bankAccountName: bankAccountName || null,
      bankAccountNumber: bankAccountNumber || null,
      bankIFSC: bankIFSC || null,
      upiHandle: upiHandle || null,
      items: {
        create: items.map((it) => ({
          orderItemId: it.orderItemId,
          quantity: it.quantity || 1,
        })),
      },
    },
    include: {
      items: { include: { orderItem: true } },
      order: { select: { orderNumber: true, total: true, paymentMethod: true } },
    },
  });

  return returnRequest;
};

// -----------------------------------------------
// CUSTOMER — list own return requests
// -----------------------------------------------
const getMyReturnRequests = async (userId) => {
  try {
    const requests = await prisma.returnRequest.findMany({
      where: { userId },
      include: {
        items: { include: { orderItem: true } },
        order: { select: { orderNumber: true, total: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return requests;
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error;
    }

    logger.error(`Return listing failed due to schema mismatch for user ${userId}: ${error.message}`);
    return [];
  }
};

// -----------------------------------------------
// CUSTOMER — get single request
// -----------------------------------------------
const getReturnRequestById = async (userId, requestId) => {
  const request = await prisma.returnRequest.findFirst({
    where: { id: requestId, userId },
    include: {
      items: { include: { orderItem: true } },
      order: {
        select: { orderNumber: true, total: true, status: true, paymentMethod: true },
      },
    },
  });
  if (!request) throw new NotFoundError('Return request not found');
  return request;
};

// -----------------------------------------------
// CUSTOMER — cancel request (only if REQUESTED)
// -----------------------------------------------
const cancelReturnRequest = async (userId, requestId) => {
  const request = await prisma.returnRequest.findFirst({
    where: { id: requestId, userId },
  });
  if (!request) throw new NotFoundError('Return request not found');
  if (request.status !== 'REQUESTED') {
    throw new BadRequestError('Only pending requests can be cancelled');
  }
  const updated = await prisma.returnRequest.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' },
  });
  return updated;
};

// -----------------------------------------------
// ADMIN — list all requests with optional filters
// -----------------------------------------------
const getAllReturnRequests = async (query = {}) => {
  const { status, type, page = 1, limit = 20 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [requests, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { orderNumber: true, total: true, paymentMethod: true } },
        items: { include: { orderItem: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.returnRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

// -----------------------------------------------
// ADMIN — update status + note
// -----------------------------------------------
const updateReturnRequestStatus = async (requestId, { status, adminNote }) => {
  const request = await prisma.returnRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError('Return request not found');

  const terminalStatuses = ['COMPLETED', 'REJECTED', 'CANCELLED'];
  if (terminalStatuses.includes(request.status)) {
    throw new BadRequestError(`Cannot update a ${request.status} request`);
  }

  const resolvedStatuses = ['COMPLETED', 'REJECTED'];
  const updated = await prisma.returnRequest.update({
    where: { id: requestId },
    data: {
      status,
      adminNote: adminNote !== undefined ? adminNote : request.adminNote,
      resolvedAt: resolvedStatuses.includes(status) ? new Date() : request.resolvedAt,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      order: { select: { orderNumber: true, total: true, paymentMethod: true } },
      items: { include: { orderItem: true } },
    },
  });

  // When a RETURN (not replacement) is completed, mark the order as REFUNDED
  if (status === 'COMPLETED' && request.type === 'RETURN') {
    await prisma.order.update({
      where: { id: request.orderId },
      data: { status: 'REFUNDED' },
    });
  }

  return updated;
};

module.exports = {
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequestById,
  cancelReturnRequest,
  getAllReturnRequests,
  updateReturnRequestStatus,
};
