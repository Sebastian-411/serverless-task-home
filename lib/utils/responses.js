/**
 * Standardized API Response Utilities
 * Provides consistent response formats across all endpoints
 */

/**
 * Success response with data
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Created response for new resources
 * @param {Object} res - Express response object
 * @param {any} data - Created resource data
 * @param {string} message - Success message
 */
const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

/**
 * No content response for deletions
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const noContent = (res, message = 'Resource deleted successfully') => {
  return res.status(204).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} error - Error type
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array} details - Additional error details
 */
const error = (res, error = 'Error', message = 'An error occurred', statusCode = 500, details = []) => {
  const response = {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString()
  };

  if (details && details.length > 0) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Bad request response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Array} details - Validation details
 */
const badRequest = (res, message = 'Bad request', details = []) => {
  return error(res, 'Bad Request', message, 400, details);
};

/**
 * Unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const unauthorized = (res, message = 'Unauthorized access') => {
  return error(res, 'Unauthorized', message, 401);
};

/**
 * Forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const forbidden = (res, message = 'Forbidden access') => {
  return error(res, 'Forbidden', message, 403);
};

/**
 * Not found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, 'Not Found', message, 404);
};

/**
 * Conflict response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const conflict = (res, message = 'Resource conflict') => {
  return error(res, 'Conflict', message, 409);
};

/**
 * Validation error response (422)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Array} details - Validation details
 */
const validationError = (res, message = 'Validation failed', details = []) => {
  return error(res, 'Validation Error', message, 422, details);
};

/**
 * Internal server error response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const serverError = (res, message = 'Internal server error') => {
  return error(res, 'Internal Server Error', message, 500);
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} items - Data items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const paginated = (res, items, pagination, message = 'Data retrieved successfully') => {
  const response = {
    success: true,
    message,
    data: items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages || Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.hasNext || pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.hasPrev || pagination.page > 1
    },
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
};

/**
 * Health check response
 * @param {Object} res - Express response object
 * @param {Object} status - Health status data
 */
const healthCheck = (res, status = {}) => {
  const response = {
    success: true,
    message: 'Service is healthy',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      ...status
    }
  };

  return res.status(200).json(response);
};

/**
 * Wrapper function to handle async route errors
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped route handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Transform database errors to user-friendly messages
 * @param {Error} err - Database error
 * @returns {Object} Transformed error object
 */
const transformDatabaseError = (err) => {
  const response = {
    error: 'Database Error',
    message: 'An error occurred while processing your request',
    statusCode: 500
  };

  if (err.code === 'P2002') {
    response.error = 'Conflict';
    response.message = 'A resource with this information already exists';
    response.statusCode = 409;
  } else if (err.code === 'P2025') {
    response.error = 'Not Found';
    response.message = 'The requested resource was not found';
    response.statusCode = 404;
  } else if (err.code === 'P2003') {
    response.error = 'Constraint Error';
    response.message = 'This operation violates a database constraint';
    response.statusCode = 400;
  }

  return response;
};

/**
 * Send response with proper error handling
 * @param {Object} res - Express response object
 * @param {Function} operation - Async operation to execute
 */
const sendResponse = async (res, operation) => {
  try {
    const result = await operation();
    
    if (result.success === false) {
      return error(res, result.error, result.message, result.statusCode || 400);
    }
    
    return success(res, result.data, result.message);
  } catch (err) {
    console.error('Response error:', err);
    
    const transformedError = transformDatabaseError(err);
    return error(res, transformedError.error, transformedError.message, transformedError.statusCode);
  }
};

module.exports = {
  success,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
  paginated,
  healthCheck,
  asyncHandler,
  transformDatabaseError,
  sendResponse
}; 