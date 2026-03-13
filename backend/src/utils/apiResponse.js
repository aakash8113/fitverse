// Standard API Response Format
// Ensures consistent response structure across all endpoints

class ApiResponse {
  /**
   * Success Response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {Object} data - Response data
   * @param {String} message - Success message
   */
  static success(res, statusCode = 200, data = null, message = 'Success') {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Error Response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {String} message - Error message
   * @param {Object} errors - Validation errors (optional)
   * @param {String} code - Stable error code for frontend branching (optional)
   */
  static error(res, statusCode = 500, message = 'Internal Server Error', errors = null, code = null) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    if (code) {
      response.code = code;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Paginated Response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {Number} page - Current page
   * @param {Number} limit - Items per page
   * @param {Number} total - Total number of items
   */
  static paginated(res, data, page, limit, total) {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  }
}

module.exports = ApiResponse;
