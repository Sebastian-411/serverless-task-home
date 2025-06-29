// User Repository Prisma Implementation with High-Performance Caching
import type { PrismaClient} from '../../../lib/generated/prisma';
import { User as PrismaUser, Address as PrismaAddress } from '../../../lib/generated/prisma';
import { Cache, CacheKeys } from '../../../shared/cache/cache.service';

export interface CreateUserData {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: 'ADMIN' | 'USER';
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
  } | null;
}

export interface UserRepository {
  create(user: CreateUserData): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  findAllPaginated(offset: number, limit: number): Promise<any[]>;
  count(): Promise<number>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  // ULTRA-FAST assignment validation methods
  findByIdMinimal(id: string): Promise<{ id: string; role: string; name: string } | null>;
  validateUsersForAssignment(assigneeId: string, assignedById: string): Promise<{
    assignee: { id: string; role: string; name: string } | null;
    assignedBy: { id: string; role: string; name: string } | null;
  }>;
}

export class UserRepositoryPrisma implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userData: CreateUserData): Promise<any> {
    try {
      // Fast cached email check - O(1)
      const existingUser = await this.findByEmail(userData.email);

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user with address if provided
      const user = await this.prisma.user.create({
        data: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          role: userData.role,
          address: userData.address ? {
            create: userData.address
          } : undefined
        },
        include: {
          address: true
        }
      });

      // Proactively cache the new user
      Cache.set(CacheKeys.user(user.id), user, 3 * 60 * 1000);
      Cache.set(CacheKeys.userByEmail(user.email), user, 5 * 60 * 1000);
      
      // Invalidate user lists to include new user
      Cache.invalidatePattern('users:list.*');

      return user;
    } catch (error) {
      console.error('Error creating user in database:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<any | null> {
    try {
      // Ultra-fast cache lookup - O(1)
      return await Cache.getOrSet(
        CacheKeys.user(id),
        async () => {
          const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
              address: true
            }
          });
          return user;
        },
        3 * 60 * 1000 // 3 minutes TTL for user data
      );
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<any | null> {
    try {
      // High-performance email lookup with cache - O(1)
      return await Cache.getOrSet(
        CacheKeys.userByEmail(email),
        async () => {
          const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
              address: true
            }
          });
          return user;
        },
        5 * 60 * 1000 // 5 minutes TTL for auth-related lookups
      );
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  async findAll(): Promise<any[]> {
    try {
      // Cached user list for admin endpoints - O(1)
      return await Cache.getOrSet(
        CacheKeys.userList(),
        async () => {
          const users = await this.prisma.user.findMany({
            include: {
              address: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
          return users;
        },
        2 * 60 * 1000 // 2 minutes TTL for list views
      );
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  async findAllPaginated(offset: number, limit: number): Promise<any[]> {
    try {
      console.log(`Executing optimized findAllPaginated query with offset: ${offset}, limit: ${limit}`);
      const startTime = Date.now();
      
      const users = await this.prisma.user.findMany({
        include: {
          address: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      });
      
      const queryTime = Date.now() - startTime;
      console.log(`findAllPaginated query completed in ${queryTime}ms`);
      
      return users;
    } catch (error) {
      console.error('Error finding paginated users:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      console.log('Executing optimized count query for users');
      const startTime = Date.now();
      
      const total = await this.prisma.user.count();
      
      const queryTime = Date.now() - startTime;
      console.log(`Count query completed in ${queryTime}ms - Total: ${total}`);
      
      return total;
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }

  async update(id: string, data: any): Promise<any> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: {
          address: true
        }
      });

      // Invalidate related caches - Smart cache management
      Cache.delete(CacheKeys.user(id));
      if (user.email) {
        Cache.delete(CacheKeys.userByEmail(user.email));
      }
      Cache.invalidatePattern('users:list.*'); // Clear all user lists
      
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Get user data before deletion for cache cleanup
      const user = await this.findById(id);
      
      await this.prisma.user.delete({
        where: { id }
      });

      // Clean up all related caches
      Cache.delete(CacheKeys.user(id));
      if (user?.email) {
        Cache.delete(CacheKeys.userByEmail(user.email));
      }
      Cache.invalidatePattern('users:list.*');
      
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async findByIdMinimal(id: string): Promise<{ id: string; role: string; name: string } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          name: true
        }
      });
      return user;
    } catch (error) {
      console.error('Error finding user by ID minimal:', error);
      throw error;
    }
  }

  async validateUsersForAssignment(assigneeId: string, assignedById: string): Promise<{
    assignee: { id: string; role: string; name: string } | null;
    assignedBy: { id: string; role: string; name: string } | null;
  }> {
    try {
      console.log(`🚀 PARALLEL user validation: ${assigneeId} + ${assignedById}`);
      const startTime = Date.now();

      // Execute both user lookups in parallel for maximum speed
      const [assignee, assignedBy] = await Promise.all([
        this.findByIdMinimal(assigneeId),
        this.findByIdMinimal(assignedById)
      ]);

      const queryTime = Date.now() - startTime;
      console.log(`⚡ Parallel user validation completed in ${queryTime}ms`);
      
      return { assignee, assignedBy };
    } catch (error) {
      console.error('Error validating users for assignment:', error);
      throw error;
    }
  }
} 