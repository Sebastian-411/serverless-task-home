/**
 * User Service
 * Handles all user-related database operations with proper Address handling
 */

const { getPrismaClient } = require('../database/prisma');
const { User, Address } = require('../../models');

/**
 * User Service class
 * Provides high-level operations for user management
 */
class UserService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Get all users with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users with pagination info
   */
  async getUsers(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = null,
      includeAddress = true
    } = options;

    const skip = (page - 1) * limit;
    
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { role: role.toUpperCase() })
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          address: includeAddress
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      users: users.map(user => User.fromPrisma(user)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @param {boolean} includeAddress - Include address data
   * @returns {Promise<User|null>} User instance or null
   */
  async getUserById(id, includeAddress = true) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        address: includeAddress
      }
    });

    return user ? User.fromPrisma(user) : null;
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @param {boolean} includeAddress - Include address data
   * @returns {Promise<User|null>} User instance or null
   */
  async getUserByEmail(email, includeAddress = true) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        address: includeAddress
      }
    });

    return user ? User.fromPrisma(user) : null;
  }

  /**
   * Create a new user with address
   * @param {Object} userData - User data
   * @returns {Promise<User>} Created user instance
   */
  async createUser(userData) {
    // Create User model instance for validation
    const user = User.create(userData);
    
    const createData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role.toUpperCase(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Handle address creation if provided
    if (user.address) {
      createData.address = {
        create: user.address.toPrisma()
      };
    }

    const createdUser = await this.prisma.user.create({
      data: createData,
      include: {
        address: true
      }
    });

    return User.fromPrisma(createdUser);
  }

  /**
   * Update user information
   * @param {string} id - User ID
   * @param {Object} updates - Update data
   * @returns {Promise<User>} Updated user instance
   */
  async updateUser(id, updates) {
    // Get existing user first
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Apply updates to model for validation
    const updatedUser = existingUser.update(updates);
    
    const updateData = {
      name: updatedUser.name,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role.toUpperCase(),
      updatedAt: new Date()
    };

    // Handle address updates
    if (updates.address !== undefined) {
      if (updates.address === null) {
        // Remove address
        if (existingUser.address) {
          await this.prisma.address.delete({
            where: { id: existingUser.address.id }
          });
        }
        updateData.addressId = null;
      } else {
        // Update or create address
        if (existingUser.address) {
          // Update existing address
          await this.prisma.address.update({
            where: { id: existingUser.address.id },
            data: updatedUser.address.toPrisma()
          });
        } else {
          // Create new address
          const newAddress = await this.prisma.address.create({
            data: updatedUser.address.toPrisma()
          });
          updateData.addressId = newAddress.id;
        }
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        address: true
      }
    });

    return User.fromPrisma(user);
  }

  /**
   * Delete user and associated address
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(id) {
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete in transaction to ensure consistency
    await this.prisma.$transaction(async (prisma) => {
      // Delete address if exists
      if (user.address) {
        await prisma.address.delete({
          where: { id: user.address.id }
        });
      }

      // Delete user
      await prisma.user.delete({
        where: { id }
      });
    });

    return true;
  }

  /**
   * Update user's address specifically
   * @param {string} userId - User ID
   * @param {Object} addressData - Address data
   * @returns {Promise<Address>} Updated address instance
   */
  async updateUserAddress(userId, addressData) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let address;
    if (user.address) {
      // Update existing address
      const updatedAddress = user.address.updateAddress(addressData);
      address = await this.prisma.address.update({
        where: { id: user.address.id },
        data: updatedAddress.toPrisma()
      });
    } else {
      // Create new address
      const newAddress = Address.create(addressData);
      address = await this.prisma.address.create({
        data: newAddress.toPrisma()
      });

      // Link address to user
      await this.prisma.user.update({
        where: { id: userId },
        data: { addressId: address.id }
      });
    }

    return Address.fromPrisma(address);
  }

  /**
   * Get users by country
   * @param {string} country - Country name
   * @returns {Promise<User[]>} Users in specified country
   */
  async getUsersByCountry(country) {
    const users = await this.prisma.user.findMany({
      include: {
        address: true
      },
      where: {
        address: {
          country: {
            contains: country,
            mode: 'insensitive'
          }
        }
      }
    });

    return users.map(user => User.fromPrisma(user));
  }

  /**
   * Search users by address criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<User[]>} Matching users
   */
  async searchUsersByAddress(criteria = {}) {
    const { city, stateOrProvince, country, postalCode } = criteria;
    
    const where = {
      address: {
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(stateOrProvince && { stateOrProvince: { contains: stateOrProvince, mode: 'insensitive' } }),
        ...(country && { country: { contains: country, mode: 'insensitive' } }),
        ...(postalCode && { postalCode: { contains: postalCode, mode: 'insensitive' } })
      }
    };

    const users = await this.prisma.user.findMany({
      where,
      include: {
        address: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return users.map(user => User.fromPrisma(user));
  }

  /**
   * Check if email exists (for validation)
   * @param {string} email - Email to check
   * @param {string} excludeUserId - User ID to exclude
   * @returns {Promise<boolean>} True if email exists
   */
  async emailExists(email, excludeUserId = null) {
    const where = { email: email.toLowerCase() };
    
    if (excludeUserId) {
      where.NOT = { id: excludeUserId };
    }

    const user = await this.prisma.user.findFirst({ where });
    return !!user;
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    const [
      totalUsers,
      adminUsers,
      usersWithAddress,
      recentUsers
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { addressId: { not: null } } }),
      this.prisma.user.count({ 
        where: { 
          createdAt: { 
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          } 
        } 
      })
    ]);

    return {
      total: totalUsers,
      admins: adminUsers,
      regularUsers: totalUsers - adminUsers,
      withAddress: usersWithAddress,
      withoutAddress: totalUsers - usersWithAddress,
      recentSignups: recentUsers
    };
  }
}

// Export singleton instance
const userService = new UserService();

module.exports = userService; 