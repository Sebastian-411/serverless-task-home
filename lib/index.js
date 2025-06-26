/**
 * Library Main Entry Point
 * Centralized exports for all lib modules
 */

// Database
const { 
  getPrismaClient, 
  createPrismaClient, 
  disconnectPrisma, 
  checkDatabaseHealth,
  executeTransaction,
  DatabaseUtils 
} = require('./database/prisma');

// Configuration
const { 
  getSupabaseClient, 
  createSupabaseClient, 
  validateSupabaseConfig,
  supabaseService,
  SupabaseService 
} = require('./config/supabase');

// Authentication
const { 
  authService, 
  AuthService 
} = require('./auth/authService');

// Services
const userService = require('./services/userService');
const taskService = require('./services/taskService');

// Utilities
const {
  authenticate,
  requireAdmin,
  validateRequest,
  validatePagination,
  handleErrors,
  configureCors,
  rateLimit,
  logRequests
} = require('./utils/middleware');

const {
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
} = require('./utils/responses');

// Database exports
const database = {
  getPrismaClient,
  createPrismaClient,
  disconnectPrisma,
  checkDatabaseHealth,
  executeTransaction,
  DatabaseUtils
};

// Configuration exports
const config = {
  supabase: {
    getSupabaseClient,
    createSupabaseClient,
    validateSupabaseConfig,
    supabaseService,
    SupabaseService
  }
};

// Authentication exports
const auth = {
  authService,
  AuthService
};

// Services exports
const services = {
  userService,
  taskService
};

// Utilities exports
const utils = {
  middleware: {
    authenticate,
    requireAdmin,
    validateRequest,
    validatePagination,
    handleErrors,
    configureCors,
    rateLimit,
    logRequests
  },
  responses: {
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
  }
};

// Main exports for easy access
module.exports = {
  // Direct service access
  userService,
  taskService,
  authService,
  
  // Database utilities
  database,
  
  // Configuration
  config,
  
  // Authentication
  auth,
  
  // All services
  services,
  
  // Utilities
  utils,
  
  // Common middleware (direct access)
  middleware: utils.middleware,
  
  // Common responses (direct access)
  responses: utils.responses,
  
  // Legacy compatibility exports
  prisma: database,
  supabase: config.supabase
}; 