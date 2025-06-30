import type { UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import type { AuthContext } from '../../common/config/middlewares/auth.middleware';
import { get, set, Keys } from '../../common/config/cache/cache.service';
import { UnauthorizedError } from '../../common/domain/exceptions/unauthorized.error';
import { UserRole } from '../domain';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface GetUsersResponse {
  users: {
    id: string;
    email: string;
    name: string;
    phoneNumber: string;
    role: 'admin' | 'user';
    address?: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      stateOrProvince: string;
      postalCode: string;
      country: string;
    };
    createdAt: Date;
  }[];
  total: number;
}

export class GetUsersUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Retrieves a paginated list of users, only accessible by administrators.
   * Performs authentication and authorization checks, supports cache for fast access.
   *
   * @param {AuthContext} authContext - The authentication context of the current request.
   * @param {PaginationOptions} [pagination] - Optional pagination options (page, limit).
   * @returns {Promise<GetUsersResponse>} The paginated list of users and total count.
   * @throws {UnauthorizedError} If authentication or authorization fails.
   * @throws {Error} For unexpected repository or system errors.
   */
  async execute(authContext: AuthContext, pagination?: PaginationOptions): Promise<GetUsersResponse> {
    console.log('[GetUsersUseCase][execute] Get users request received', { authUserId: authContext?.user?.id, authUserRole: authContext?.user?.role, pagination });
    try {
      // Step 1: Authentication check
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn('[GetUsersUseCase][execute] Validation failed: Authentication required');
        throw new UnauthorizedError('Authentication required');
      }

      // Step 2: Authorization check - Only administrators can view all users
      if (authContext.user.role.toLowerCase() !== UserRole.ADMIN.toLowerCase()) {
        console.warn('[GetUsersUseCase][execute] Validation failed: Only administrators can access the users list', { authUserId: authContext.user.id });
        throw new UnauthorizedError('Only administrators can access the users list');
      }

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;

      // Ultra-fast cache lookup first (only for first page without pagination)
      if (!pagination || (page === 1 && limit === 10)) {
        const cacheKey = Keys.users();
        const cachedUsers = await get<GetUsersResponse['users']>(cacheKey);
        if (cachedUsers) {
          console.log('[GetUsersUseCase][execute] Cache HIT - Users list served', { adminEmail: authContext.user.email });
          return {
            users: cachedUsers,
            total: cachedUsers.length
          };
        }
      }

      console.log('[GetUsersUseCase][execute] Cache MISS - Fetching users from database', { adminEmail: authContext.user.email, page, limit });
      const startTime = Date.now();
      // Get paginated users and total count
      const [users, total] = await Promise.all([
        this.userRepository.findAllPaginated(offset, limit),
        this.userRepository.count()
      ]);

      const transformedUsers = users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role.toLowerCase() as 'admin' | 'user',
        address: user.address ? {
          addressLine1: user.address.addressLine1,
          addressLine2: user.address.addressLine2,
          city: user.address.city,
          stateOrProvince: user.address.stateOrProvince,
          postalCode: user.address.postalCode,
          country: user.address.country
        } : undefined,
        createdAt: user.createdAt
      }));

      // Cache the result for ultra-fast subsequent requests (only first page)
      if (!pagination || (page === 1 && limit === 10)) {
        await set(Keys.users(), transformedUsers);
      }

      const queryTime = Date.now() - startTime;
      console.log('[GetUsersUseCase][execute] Users fetched and cached', { queryTimeMs: queryTime, total, page, limit });

      return {
        users: transformedUsers,
        total
      };
    } catch (error) {
      console.error('[GetUsersUseCase][execute] Unexpected error retrieving users list', { error });
      // Re-throw domain errors to preserve specific messages
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new Error('Error retrieving users list');
    }
  }
} 