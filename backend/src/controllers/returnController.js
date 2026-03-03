// Return & Replacement Controller

const returnService = require('../services/returnService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

// POST /api/returns
const createReturnRequest = asyncHandler(async (req, res) => {
  const request = await returnService.createReturnRequest(req.user.id, req.body);
  return ApiResponse.success(res, 201, request, 'Return request submitted successfully');
});

// GET /api/returns
const getMyReturnRequests = asyncHandler(async (req, res) => {
  const requests = await returnService.getMyReturnRequests(req.user.id);
  return ApiResponse.success(res, 200, requests, 'Return requests retrieved');
});

// GET /api/returns/:id
const getReturnRequestById = asyncHandler(async (req, res) => {
  const request = await returnService.getReturnRequestById(req.user.id, req.params.id);
  return ApiResponse.success(res, 200, request, 'Return request retrieved');
});

// DELETE /api/returns/:id
const cancelReturnRequest = asyncHandler(async (req, res) => {
  const request = await returnService.cancelReturnRequest(req.user.id, req.params.id);
  return ApiResponse.success(res, 200, request, 'Return request cancelled');
});

// GET /api/admin/returns
const getAllReturnRequests = asyncHandler(async (req, res) => {
  const result = await returnService.getAllReturnRequests(req.query);
  return ApiResponse.success(res, 200, result, 'All return requests retrieved');
});

// PATCH /api/admin/returns/:id
const updateReturnRequestStatus = asyncHandler(async (req, res) => {
  const updated = await returnService.updateReturnRequestStatus(req.params.id, req.body);
  return ApiResponse.success(res, 200, updated, 'Return request updated');
});

module.exports = {
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequestById,
  cancelReturnRequest,
  getAllReturnRequests,
  updateReturnRequestStatus,
};
