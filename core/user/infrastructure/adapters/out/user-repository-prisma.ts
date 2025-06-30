// User Repository Prisma Implementation with High-Performance Caching

import { get, set, remove, getOrSet, invalidatePattern, Keys } from '../../../../common/config/cache/cache.service';
import type { UserRepositoryPort } from '../../../domain/ports/out/user-repository.port';
import type { CreateUserData, UpdateUserData } from '../../../domain/entities/user.entity';
import type { PrismaClient } from '../../../../../lib/generated/prisma';

/**
 * UserRepositoryPrisma implements the UserRepositoryPort using Prisma ORM.
 * 
 * It adds high-performance caching to critical user operations.
 * Each method is logged for observability, and caching is tuned
 * for specific use cases such as lookup by ID or listing users.
 */
export class UserRepositoryPrisma implements UserRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  /**
   * Creates a new user record, including address if provided.
   * If a user with the given email already exists, throws an error.
   * Caches the created user and invalidates related user lists.
   *
   * @param {CreateUserData} userData - Data used to create the new user.
   * @returns {Promise<any>} The created user entity with address included.
   * @throws {Error} If the user already exists or DB operation fails.
   */
  async create(userData: CreateUserData): Promise<any> {
    console.log('[UserRepositoryPrisma][create] Creating user', { email: userData.email });
    try {
      const existingUser = await this.findByEmail(userData.email);

      if (existingUser) {
        console.warn('[UserRepositoryPrisma][create] Validation failed: User with this email already exists', { email: userData.email });
        throw new Error('User with this email already exists');
      }

      const user = await this.prisma.user.create({
        data: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          role: userData.role,
          address: userData.address ? { create: userData.address } : undefined
        },
        include: {
          address: true
        }
      });

      set(Keys.user(user.id), user, 3 * 60 * 1000);
      set(Keys.userByEmail(user.email), user, 5 * 60 * 1000);
      invalidatePattern('users:list.*');

      console.log('[UserRepositoryPrisma][create] User created and cached', { userId: user.id });

      return user;
    } catch (error) {
      console.error('[UserRepositoryPrisma][create] Unexpected error while creating user', { error });
      throw error;
    }
  }

  /**
   * Finds a user by ID using a cache-first strategy.
   * Logs the lookup attempt and result source.
   *
   * @param {string} id - The ID of the user to find.
   * @returns {Promise<any|null>} The user entity with address or null if not found.
   * @throws {Error} If the lookup fails.
   */
  async findById(id: string): Promise<any | null> {
    console.log('[UserRepositoryPrisma][findById] Looking up user by ID', { id });
    try {
      return await getOrSet(
        Keys.user(id),
        async () => {
          const user = await this.prisma.user.findUnique({
            where: { id },
            include: { address: true }
          });

          console.log('[UserRepositoryPrisma][findById] User fetched from DB by ID:', id);
          return user;
        },
        3 * 60 * 1000
      );
    } catch (error) {
      console.error('[UserRepositoryPrisma][findById] Unexpected error while finding user by ID', { id, error });
      throw error;
    }
  }

  /**
   * Finds a user by email using a cache-first strategy.
   * Logs the lookup attempt and result source.
   *
   * @param {string} email - The email of the user to find.
   * @returns {Promise<any|null>} The user entity with address or null if not found.
   * @throws {Error} If the lookup fails.
   */
  async findByEmail(email: string): Promise<any | null> {
    console.log('[UserRepositoryPrisma][findByEmail] Looking up user by email', { email });
    try {
      return await getOrSet(
        Keys.userByEmail(email),
        async () => {
          const user = await this.prisma.user.findUnique({
            where: { email },
            include: { address: true }
          });

          console.log('[UserRepositoryPrisma][findByEmail] User fetched from DB by email:', email);
          return user;
        },
        5 * 60 * 1000
      );
    } catch (error) {
      console.error('[UserRepositoryPrisma][findByEmail] Unexpected error while finding user by email', { email, error });
      throw error;
    }
  }

  /**
   * Retrieves all users with address included, using cache for performance.
   * Logs the retrieval attempt and result source.
   *
   * @returns {Promise<any[]>} An array of user entities ordered by creation date.
   * @throws {Error} If the query fails.
   */
  async findAll(): Promise<any[]> {
    console.log('[UserRepositoryPrisma][findAll] Retrieving all users');
    try {
      return await getOrSet(
        Keys.users(),
        async () => {
          const users = await this.prisma.user.findMany({
            include: { address: true },
            orderBy: { createdAt: 'desc' }
          });

          console.log('[UserRepositoryPrisma][findAll] User list fetched from DB');
          return users;
        },
        2 * 60 * 1000
      );
    } catch (error) {
      console.error('[UserRepositoryPrisma][findAll] Unexpected error while retrieving all users', { error });
      throw error;
    }
  }

  /**
   * Retrieves a paginated set of users, including address.
   * Logs the query parameters and duration.
   *
   * @param {number} offset - Number of records to skip.
   * @param {number} limit - Number of records to retrieve.
   * @returns {Promise<any[]>} An array of user entities.
   * @throws {Error} If the query fails.
   */
  async findAllPaginated(offset: number, limit: number): Promise<any[]> {
    console.log('[UserRepositoryPrisma][findAllPaginated] Paginated query start', { offset, limit });

    const startTime = Date.now();

    const users = await this.prisma.user.findMany({
      include: { address: true },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    const duration = Date.now() - startTime;
    console.log('[UserRepositoryPrisma][findAllPaginated] Paginated query complete', { durationMs: duration, count: users.length });

    return users;
  }

  /**
   * Counts all user records in the database.
   * Logs the count attempt and duration.
   *
   * @returns {Promise<number>} The total number of users.
   * @throws {Error} If the count query fails.
   */
  async count(): Promise<number> {
    console.log('[UserRepositoryPrisma][count] Counting users');
    try {
      const startTime = Date.now();
      const total = await this.prisma.user.count();
      const duration = Date.now() - startTime;

      console.log('[UserRepositoryPrisma][count] Count completed', { total, durationMs: duration });

      return total;
    } catch (error) {
      console.error('[UserRepositoryPrisma][count] Unexpected error while counting users', { error });
      throw error;
    }
  }

  /**
   * Updates a user by ID and upserts address if provided.
   * Updates relevant caches and invalidates related lists.
   * Logs the update attempt and result.
   *
   * @param {string} id - The ID of the user to update.
   * @param {UpdateUserData} data - Partial user data including optional address.
   * @returns {Promise<any>} The updated user entity.
   * @throws {Error} If update fails.
   */
  async update(id: string, data: UpdateUserData): Promise<any> {
    console.log('[UserRepositoryPrisma][update] Updating user', { userId: id });
    try {
      const updateData: any = { ...data };

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
        include: { address: true }
      });

      set(Keys.user(user.id), user, 3 * 60 * 1000);
      set(Keys.userByEmail(user.email), user, 5 * 60 * 1000);
      invalidatePattern('users:list.*');

      console.log('[UserRepositoryPrisma][update] User updated and cache refreshed', { userId: id });

      return user;
    } catch (error) {
      console.error('[UserRepositoryPrisma][update] Unexpected error while updating user', { userId: id, error });
      throw error;
    }
  }

  /**
   * Deletes a user by ID, clears related cache entries and invalidates lists.
   * Logs the deletion attempt and result.
   *
   * @param {string} id - The ID of the user to delete.
   * @returns {Promise<void>} Resolves when the user is deleted.
   * @throws {Error} If deletion fails.
   */
  async delete(id: string): Promise<void> {
    console.log('[UserRepositoryPrisma][delete] Deleting user', { userId: id });
    try {
      const user = await this.findById(id);

      await this.prisma.user.delete({ where: { id } });

      remove(Keys.user(id));
      if (user?.email) remove(Keys.userByEmail(user.email));
      invalidatePattern('users:list.*');

      console.log('[UserRepositoryPrisma][delete] User deleted and cache cleared', { userId: id });
    } catch (error) {
      console.error('[UserRepositoryPrisma][delete] Unexpected error while deleting user', { userId: id, error });
      throw error;
    }
  }

  /**
   * Finds a user by ID returning only minimal fields (id, role, name).
   * Useful for lightweight permission checks or references.
   * Logs the lookup attempt and result source.
   *
   * @param {string} id - The user ID to look up.
   * @returns {Promise<{ id: string; role: string; name: string } | null>} A minimal user object or null if not found.
   * @throws {Error} If lookup fails.
   */
  async findByIdMinimal(id: string): Promise<{ id: string; role: string; name: string } | null> {
    console.log('[UserRepositoryPrisma][findByIdMinimal] Retrieving minimal user data', { userId: id });
    try {
      return await getOrSet(
        Keys.user(id),
        async () => {
          const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true, name: true }
          });

          console.log('[UserRepositoryPrisma][findByIdMinimal] Minimal user data fetched from DB', { userId: id });
          return user;
        },
        5 * 60 * 1000
      );
    } catch (error) {
      console.error('[UserRepositoryPrisma][findByIdMinimal] Unexpected error while retrieving minimal user', { userId: id, error });
      throw error;
    }
  }

  /**
   * Validates the existence of both assignee and assigner users
   * by retrieving their minimal info in parallel.
   * Logs the validation attempt and result.
   *
   * @param {string} assigneeId - The ID of the user being assigned the task.
   * @param {string} assignedById - The ID of the user assigning the task.
   * @returns {Promise<{ assignee: { id: string; role: string; name: string } | null; assignedBy: { id: string; role: string; name: string } | null; }>} An object with both minimal user entities.
   * @throws {Error} If lookup for either user fails.
   */
  async validateUsersForAssignment(assigneeId: string, assignedById: string): Promise<{
    assignee: { id: string; role: string; name: string } | null;
    assignedBy: { id: string; role: string; name: string } | null;
  }> {
    console.log('[UserRepositoryPrisma][validateUsersForAssignment] Validating users for assignment', { assigneeId, assignedById });
    try {
      const [assignee, assignedBy] = await Promise.all([
        this.findByIdMinimal(assigneeId),
        this.findByIdMinimal(assignedById)
      ]);

      return { assignee, assignedBy };
    } catch (error) {
      console.error('[UserRepositoryPrisma][validateUsersForAssignment] Unexpected error while validating users for assignment', { assigneeId, assignedById, error });
      throw error;
    }
  }
}