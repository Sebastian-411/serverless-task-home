import type { UserRepository} from '../domain/user.entity';
import { UserData } from '../domain/user.entity';

export interface AuthContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
}

export interface GetUserByIdResponse {
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

export class GetUserByIdUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string, authContext: AuthContext): Promise<GetUserByIdResponse> {
    try {
      // Verify that the user is authenticated
      if (!authContext.isAuthenticated || !authContext.user) {
        throw new Error('Authentication required to access user information');
      }

      const authenticatedUser = authContext.user;

      // Regular users can only view their own profile
      // Administrators can view any profile
      if (authenticatedUser.role === 'user' && authenticatedUser.id !== userId) {
        throw new Error('Users can only access their own profile');
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
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
      };
    } catch (error) {
      console.error('Error in GetUserByIdUseCase:', error);
      
      // Re-throw specific errors to preserve their messages
      if (error instanceof Error) {
        if (error.message === 'User not found' ||
            error.message === 'Authentication required to access user information' ||
            error.message === 'Users can only access their own profile') {
          throw error;
        }
      }
      
      throw new Error('Error retrieving user information');
    }
  }
} 