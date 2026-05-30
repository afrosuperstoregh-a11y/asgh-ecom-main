/**
 * Standardized API Response Middleware
 * Provides consistent response format and error handling
 */

class ApiResponse {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   */
  static success(res, data = null, message = 'Operation successful', statusCode = 200) {
    const response = {
      success: true,
      message,
      data,
      error: null,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {*} error - Error details
   */
  static error(res, message = 'Internal server error', statusCode = 500, error = null) {
    const response = {
      success: false,
      message,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error : null,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Validation error response
   * @param {Object} res - Express response object
   * @param {Array|Object} errors - Validation errors
   */
  static validationError(res, errors) {
    const response = {
      success: false,
      message: 'Validation failed',
      data: null,
      error: {
        type: 'validation',
        details: errors
      },
      timestamp: new Date().toISOString()
    };

    return res.status(400).json(response);
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} message - Not found message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Unauthorized message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Forbidden message
   */
  static forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, 403);
  }

  /**
   * Conflict response
   * @param {Object} res - Express response object
   * @param {string} message - Conflict message
   */
  static conflict(res, message = 'Resource conflict') {
    return this.error(res, message, 409);
  }

  /**
   * Rate limit response
   * @param {Object} res - Express response object
   * @param {string} message - Rate limit message
   */
  static rateLimit(res, message = 'Too many requests') {
    return this.error(res, message, 429);
  }
}

/**
 * Async error wrapper middleware
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware - Secure version to prevent information leakage
 */
const errorHandler = (err, req, res, next) => {
  // Generate correlation ID for tracking
  const correlationId = req.requestId || Math.random().toString(36).substr(2, 9);

  // Log error details server-side only (never exposed to client)
  // In production, use a proper logging service instead of console.error
  if (process.env.NODE_ENV === 'production') {
    console.error(`[${correlationId}] Error:`, {
      message: err.message,
      url: req.url,
      method: req.method,
      statusCode: err.statusCode || err.status || 500,
      timestamp: new Date().toISOString()
    });
  } else {
    // Development: include stack traces for debugging
    console.error(`[${correlationId}] Error:`, {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Handle specific error types with sanitized messages
  if (err.name === 'ValidationError') {
    return ApiResponse.validationError(res, err.details || 'Validation failed');
  }

  if (err.name === 'CastError') {
    return ApiResponse.error(res, 'Invalid ID format', 400);
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return ApiResponse.conflict(res, 'Record already exists');
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return ApiResponse.error(res, 'Referenced record does not exist', 400);
  }

  if (err.code === '23502') { // PostgreSQL not null violation
    return ApiResponse.validationError(res, 'Required field is missing');
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Authentication token expired');
  }

  if (err.name === 'MulterError') {
    if (err.message.includes('File too large')) {
      return ApiResponse.error(res, 'File size too large', 413);
    }
    return ApiResponse.validationError(res, 'File upload error');
  }

  // Default error response - NEVER expose internal error details to client
  const statusCode = err.statusCode || err.status || 500;
  const isClientError = statusCode < 500;
  
  // For client errors (4xx), return a generic message
  // For server errors (5xx), return a generic message to prevent information leakage
  const message = isClientError 
    ? (err.message || 'Request failed') 
    : 'Internal server error';
  
  // Only include error details in development mode
  const errorDetails = process.env.NODE_ENV === 'development' ? {
    type: err.name,
    message: err.message
  } : null;
  
  const response = {
    success: false,
    message,
    data: null,
    error: errorDetails,
    correlationId, // Include correlation ID for support tracking
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Request validation middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return ApiResponse.validationError(res, errors);
    }
    
    next();
  };
};

/**
 * Request ID middleware for tracing
 */
const requestLogger = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9);
  
  // Log request start
  console.log(`[${req.requestId}] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    console.log(`[${req.requestId}] ${req.method} ${req.url} - ${res.statusCode} - ${new Date().toISOString()}`);
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  ApiResponse,
  asyncHandler,
  errorHandler,
  validateRequest,
  requestLogger
};
