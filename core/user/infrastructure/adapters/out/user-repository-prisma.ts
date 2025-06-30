// User Repository Prisma Implementation with High-Performance Caching
import { get, set, remove, getOrSet, invalidatePattern, Keys } from '../../../../common/config/cache/cache.service';
import type { UserRepositoryPort } from '../../../domain/ports/out/user-repository.port';
import type { CreateUserData, UpdateUserData } from '../../../domain/entities/user.entity';
import { PrismaClient } from '../../../../../lib/generated/prisma';

export class UserRepositoryPrisma implements UserRepositoryPort {
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
      set(Keys.user(user.id), user, 3 * 60 * 1000);
      set(Keys.userByEmail(user.email), user, 5 * 60 * 1000);
      
      // Invalidate user lists to include new user
      invalidatePattern('users:list.*');

      return user;
    } catch (error) {
      console.error('Error creating user in database:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<any | null> {
    try {
      // Ultra-fast cache lookup - O(1)
      return await getOrSet(
        Keys.user(id),
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
      return await getOrSet(
        Keys.userByEmail(email),
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
      return await getOrSet(
        Keys.users(),
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

  async update(id: string, data: UpdateUserData): Promise<any> {
    try {
      // Prepare update data compatible with Prisma types
      const updateData: any = {
        ...data
      };

      // Handle address update separately to match Prisma's expected format
      if (data.address) {
        updateData.address = {
          upsert: {
            create: data.address,
            update: data.address
          }
        };
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          address: true
        }
      });

      // Update cache
      set(Keys.user(user.id), user, 3 * 60 * 1000);
      set(Keys.userByEmail(user.email), user, 5 * 60 * 1000);
      
      // Invalidate lists
      invalidatePattern('users:list.*');

      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Get user first to invalidate email cache
      const user = await this.findById(id);
      
      await this.prisma.user.delete({
        where: { id }
      });

      // Remove from cache
      remove(Keys.user(id));
      if (user?.email) {
        remove(Keys.userByEmail(user.email));
      }
      
      // Invalidate lists
      invalidatePattern('users:list.*');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async findByIdMinimal(id: string): Promise<{ id: string; role: string; name: string } | null> {
    try {
      return await getOrSet(
        Keys.user(id),
        async () => {
          const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
              id: true,
              role: true,
              name: true
            }
          });
          return user;
        },
        5 * 60 * 1000 // 5 minutes TTL for minimal user data
      );
    } catch (error) {
      console.error('Error finding minimal user by ID:', error);
      throw error;
    }
  }

  async validateUsersForAssignment(assigneeId: string, assignedById: string): Promise<{
    assignee: { id: string; role: string; name: string } | null;
    assignedBy: { id: string; role: string; name: string } | null;
  }> {
    try {
      const [assignee, assignedBy] = await Promise.all([
        this.findByIdMinimal(assigneeId),
        this.findByIdMinimal(assignedById)
      ]);

      return { assignee, assignedBy };
    } catch (error) {
      console.error('Error validating users for assignment:', error);
      throw error;
    }
  }
} 