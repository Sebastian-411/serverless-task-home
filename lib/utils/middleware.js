/**
 * Common Middleware Functions
 * Centralized middleware for authentication, validation, and error handling
 */

const { authService } = require('../auth/authService');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const user = await authService.verifyAuthHeader(authHeader);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid authentication token required'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return res.status(500).json({
      error: 'Authentication Error',
      message: 'Failed to authenticate request'
    });
  }
};

/**
 * Admin-only middleware
 * Requires user to be authenticated and have admin role
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const isAdmin = await authService.isUserAdmin(req.user.auth.id);

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin privileges required'
      });
    }

    next();

  } catch (error) {
    console.error('Admin middleware error:', error.message);
    return res.status(500).json({
      error: 'Authorization Error',
      message: 'Failed to verify admin privileges'
    });
  }
};

/**
 * Request validation middleware
 * Validates request body against provided schema
 */
const validateRequest = (validationRules) => {
  return (req, res, next) => {
    try {
      const errors = [];

      // Validate required fields
      if (validationRules.required) {
        for (const field of validationRules.required) {
          if (!req.body[field]) {
            errors.push(`Field '${field}' is required`);
          }
        }
      }

      // Validate field types
      if (validationRules.types) {
        for (const [field, expectedType] of Object.entries(validationRules.types)) {
          if (req.body[field] !== undefined) {
            const actualType = typeof req.body[field];
            if (actualType !== expectedType) {
              errors.push(`Field '${field}' must be of type ${expectedType}, got ${actualType}`);
            }
          }
        }
      }

      // Validate string lengths
      if (validationRules.lengths) {
        for (const [field, rules] of Object.entries(validationRules.lengths)) {
          if (req.body[field] && typeof req.body[field] === 'string') {
            const value = req.body[field];
            if (rules.min && value.length < rules.min) {
              errors.push(`Field '${field}' must be at least ${rules.min} characters long`);
            }
            if (rules.max && value.length > rules.max) {
              errors.push(`Field '${field}' must be no more than ${rules.max} characters long`);
            }
          }
        }
      }

      // Validate enum values
      if (validationRules.enums) {
        for (const [field, allowedValues] of Object.entries(validationRules.enums)) {
          if (req.body[field] !== undefined) {
            if (!allowedValues.includes(req.body[field])) {
              errors.push(`Field '${field}' must be one of: ${allowedValues.join(', ')}`);
            }
          }
        }
      }

      // Validate email format
      if (validationRules.emails) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const field of validationRules.emails) {
          if (req.body[field] && !emailRegex.test(req.body[field])) {
            errors.push(`Field '${field}' must be a valid email address`);
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Request validation failed',
          details: errors
        });
      }

      next();

    } catch (error) {
      console.error('Validation middleware error:', error.message);
      return res.status(500).json({
        error: 'Validation Error',
        message: 'Failed to validate request'
      });
    }
  };
};

/**
 * Pagination middleware
 * Standardizes pagination parameters
 */
const validatePagination = (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate page and limit values
    if (page < 1) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Page number must be 1 or greater'
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Limit must be between 1 and 100'
      });
    }

    req.pagination = { page, limit };
    next();

  } catch (error) {
    console.error('Pagination middleware error:', error.message);
    return res.status(500).json({
      error: 'Validation Error',
      message: 'Failed to validate pagination parameters'
    });
  }
};

/**
 * Error handling middleware
 * Centralized error handling for API routes
 */
const handleErrors = (error, req, res, next) => {
  console.error('API Error:', error.message);
  console.error('Stack:', error.stack);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details || []
    });
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A record with this information already exists'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
      });
    }
  }

  if (error.message === 'User not found' || error.message === 'Task not found') {
    return res.status(404).json({
      error: 'Not Found',
      message: error.message
    });
  }

  // Default error response
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
};

/**
 * CORS middleware
 * Configure CORS for API endpoints
 */
const configureCors = (req, res, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

/**
 * Rate limiting middleware (basic implementation)
 * Prevents abuse by limiting requests per IP
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => { // 100 requests per 15 minutes
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [key, timestamp] of requests.entries()) {
      if (timestamp < windowStart) {
        requests.delete(key);
      }
    }

    // Count current requests from this IP
    const userRequests = Array.from(requests.entries())
      .filter(([key, timestamp]) => key.startsWith(ip) && timestamp >= windowStart)
      .length;

    if (userRequests >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }

    // Record this request
    requests.set(`${ip}-${now}`, now);
    next();
  };
};

/**
 * Request logging middleware
 * Logs all API requests for monitoring
 */
const logRequests = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip || 'unknown'}`);
  
  // Log response time when request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  validateRequest,
  validatePagination,
  handleErrors,
  configureCors,
  rateLimit,
  logRequests
}; 