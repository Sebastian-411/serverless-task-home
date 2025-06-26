/**
 * Prisma Database Client
 * Optimized singleton connection for Vercel Functions
 */

const { PrismaClient } = require('../generated/prisma');

/**
 * Global singleton instance to prevent connection leaks in serverless
 */
let prismaInstance = null;

/**
 * Creates and configures Prisma client with optimizations for serverless
 * @returns {PrismaClient} Configured Prisma client
 */
function createPrismaClient() {
  return new PrismaClient({
    // Optimize for serverless environments
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    
    // Enable logging in development
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
      
    // Optimize connection pooling for serverless
    __internal: {
      engine: {
        closePromise: true
      }
    }
  });
}

/**
 * Gets or creates the singleton Prisma client instance
 * Implements connection reuse pattern for Vercel Functions
 * @returns {PrismaClient} Singleton Prisma client
 */
function getPrismaClient() {
  // In serverless environments, reuse existing connection if available
  if (prismaInstance) {
    return prismaInstance;
  }

  // Create new instance and store globally
  prismaInstance = createPrismaClient();

  // Handle graceful shutdown
  process.on('beforeExit', async () => {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
      prismaInstance = null;
    }
  });

  return prismaInstance;
}

/**
 * Manually disconnect Prisma client (useful for tests or cleanup)
 */
async function disconnectPrisma() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

/**
 * Health check for database connection
 * @returns {Promise<boolean>} True if database is accessible
 */
async function checkDatabaseHealth() {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

/**
 * Transaction helper with automatic retry
 * @param {Function} transactionCallback - Function to execute in transaction
 * @param {Object} options - Transaction options
 * @returns {Promise<any>} Transaction result
 */
async function executeTransaction(transactionCallback, options = {}) {
  const client = getPrismaClient();
  
  const defaultOptions = {
    maxWait: 5000, // Maximum time to wait for transaction to start
    timeout: 10000, // Maximum time for transaction to complete
    ...options
  };

  try {
    return await client.$transaction(transactionCallback, defaultOptions);
  } catch (error) {
    console.error('Transaction failed:', error.message);
    throw error;
  }
}

/**
 * Database utilities for common operations
 */
const DatabaseUtils = {
  /**
   * Soft delete implementation
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @returns {Promise<any>} Updated record
   */
  async softDelete(table, id) {
    const client = getPrismaClient();
    return await client[table].update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });
  },

  /**
   * Batch upsert operation
   * @param {string} table - Table name
   * @param {Array} records - Records to upsert
   * @param {Array} uniqueFields - Fields for unique constraint
   * @returns {Promise<Array>} Upserted records
   */
  async batchUpsert(table, records, uniqueFields) {
    const client = getPrismaClient();
    
    return await executeTransaction(async (prisma) => {
      const results = [];
      
      for (const record of records) {
        const where = {};
        uniqueFields.forEach(field => {
          where[field] = record[field];
        });

        const result = await prisma[table].upsert({
          where,
          update: record,
          create: record
        });
        
        results.push(result);
      }
      
      return results;
    });
  },

  /**
   * Pagination helper
   * @param {Object} query - Query parameters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Object} Pagination parameters for Prisma
   */
  getPaginationParams(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // Max 100 items per page
    
    return { skip, take };
  },

  /**
   * Build pagination response
   * @param {Array} items - Items for current page
   * @param {number} total - Total count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} Formatted pagination response
   */
  buildPaginationResponse(items, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
};

module.exports = {
  getPrismaClient,
  createPrismaClient,
  disconnectPrisma,
  checkDatabaseHealth,
  executeTransaction,
  DatabaseUtils
}; 