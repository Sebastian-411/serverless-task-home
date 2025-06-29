import type { UserRepository } from '../infrastructure/user.repository.prisma';
import { get, set, Keys } from '../../../shared/cache/cache.service';

export interface AuthContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
}

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
  constructor(private userRepository: UserRepository) {}

  async execute(authContext: AuthContext, pagination?: PaginationOptions): Promise<GetUsersResponse> {
    try {
      // Only administrators can view all users
      if (!authContext.isAuthenticated || authContext.user?.role !== 'admin') {
        throw new Error('Only administrators can access the users list');
      }

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;

      // Ultra-fast cache lookup first (only for first page without pagination)
      if (!pagination || (page === 1 && limit === 10)) {
        const cacheKey = Keys.users();
        const cachedUsers = await get<GetUsersResponse['users']>(cacheKey);
        
        if (cachedUsers) {
          console.log(`Cache HIT - Users list served in ~1ms for admin ${authContext.user.email}`);
          return {
            users: cachedUsers,
            total: cachedUsers.length
          };
        }
      }

      console.log(`Cache MISS - Fetching users from database for admin ${authContext.user.email} - Page: ${page}, Limit: ${limit}`);
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
      console.log(`Users fetched and cached in ${queryTime}ms - Total: ${total}, Page: ${page}, Limit: ${limit}`);
      
      return {
        users: transformedUsers,
        total
      };
    } catch (error) {
      console.error('Error in GetUsersUseCase:', error);
      
      // If it's the authorization error we threw, re-throw it to preserve the specific message
      if (error instanceof Error && error.message === 'Only administrators can access the users list') {
        throw error;
      }
      
      throw new Error('Error retrieving users list');
    }
  }
} 