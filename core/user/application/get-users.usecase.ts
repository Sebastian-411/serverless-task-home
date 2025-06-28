import { UserRepository, UserData } from '../domain/user.entity';
import { Cache, CacheKeys } from '../../../shared/cache/cache.service';

export interface AuthContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
}

export interface GetUsersResponse {
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
}

export class GetUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(authContext: AuthContext): Promise<GetUsersResponse[]> {
    try {
      // Only administrators can view all users
      if (!authContext.isAuthenticated || authContext.user?.role !== 'admin') {
        throw new Error('Only administrators can access the users list');
      }

      // Ultra-fast cache lookup first
      const cacheKey = CacheKeys.userList();
      const cachedUsers = Cache.get<GetUsersResponse[]>(cacheKey);
      
      if (cachedUsers) {
        console.log('🚀 Cache HIT - Users list served in ~1ms');
        return cachedUsers;
      }

      console.log('🔍 Cache MISS - Fetching users from database...');
      const startTime = Date.now();
      
      const users = await this.userRepository.findAll();
      
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

      // Cache the result for ultra-fast subsequent requests
      Cache.setWarm(cacheKey, transformedUsers);
      
      const queryTime = Date.now() - startTime;
      console.log(`✅ Users fetched and cached in ${queryTime}ms`);
      
      return transformedUsers;
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