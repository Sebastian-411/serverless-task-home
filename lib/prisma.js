/**
 * Prisma Client for Vercel Functions
 * Optimized singleton pattern for serverless functions
 */

const { PrismaClient } = require('@prisma/client');

// Global variable to store the Prisma client instance
let prisma;

/**
 * Get or create Prisma client instance
 * Uses singleton pattern to reuse connections in serverless environment
 * @returns {PrismaClient}
 */
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

/**
 * Converts Prisma user to our User model format
 * @param {Object} prismaUser - User from Prisma
 * @returns {Object}
 */
function formatUserFromDB(prismaUser) {
  if (!prismaUser) return null;

  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    phoneNumber: prismaUser.phoneNumber,
    address: {
      addressLine1: prismaUser.addressLine1,
      addressLine2: prismaUser.addressLine2 || '',
      city: prismaUser.city,
      stateOrProvince: prismaUser.stateOrProvince,
      postalCode: prismaUser.postalCode,
      country: prismaUser.country
    },
    role: prismaUser.role.toLowerCase(),
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString()
  };
}

/**
 * Converts our User model to Prisma format
 * @param {Object} userModel - Our User model
 * @returns {Object}
 */
function formatUserForDB(userModel) {
  return {
    id: userModel.id,
    name: userModel.name,
    email: userModel.email,
    phoneNumber: userModel.phoneNumber,
    addressLine1: userModel.address.addressLine1,
    addressLine2: userModel.address.addressLine2 || null,
    city: userModel.address.city,
    stateOrProvince: userModel.address.stateOrProvince,
    postalCode: userModel.address.postalCode,
    country: userModel.address.country,
    role: userModel.role.toUpperCase()
  };
}

/**
 * Converts Prisma task to our Task model format
 * @param {Object} prismaTask - Task from Prisma
 * @returns {Object}
 */
function formatTaskFromDB(prismaTask) {
  if (!prismaTask) return null;

  return {
    id: prismaTask.id,
    title: prismaTask.title,
    description: prismaTask.description,
    status: prismaTask.status.toLowerCase(),
    priority: prismaTask.priority.toLowerCase(),
    dueDate: prismaTask.dueDate.toISOString(),
    assignedTo: prismaTask.assignedToId,
    createdBy: prismaTask.createdById,
    createdAt: prismaTask.createdAt.toISOString(),
    updatedAt: prismaTask.updatedAt.toISOString()
  };
}

/**
 * Converts our Task model to Prisma format
 * @param {Object} taskModel - Our Task model
 * @returns {Object}
 */
function formatTaskForDB(taskModel) {
  return {
    id: taskModel.id,
    title: taskModel.title,
    description: taskModel.description,
    status: taskModel.status.toUpperCase(),
    priority: taskModel.priority.toUpperCase(),
    dueDate: new Date(taskModel.dueDate),
    assignedToId: taskModel.assignedTo || null,
    createdById: taskModel.createdBy
  };
}

module.exports = {
  getPrismaClient,
  formatUserFromDB,
  formatUserForDB,
  formatTaskFromDB,
  formatTaskForDB
}; 