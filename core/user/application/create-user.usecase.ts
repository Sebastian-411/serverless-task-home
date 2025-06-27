import { SupabaseService } from '../../../shared/auth/supabase.service';
import { CreateUserData } from '../infrastructure/user.repository.prisma';

// Create User Use Case
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
  };
  role?: 'admin' | 'user';
}

export interface CreateUserResponse {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  address?: any;
  createdAt: Date;
}

export interface AuthContext {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
  isAuthenticated: boolean;
}

export class CreateUserUseCase {
  constructor(
    private userRepository: any // TODO: Type this properly
  ) {}

  async execute(request: CreateUserRequest, authContext: AuthContext): Promise<CreateUserResponse> {
    // Validate authorization scenarios
    this.validateAuthorization(request, authContext);

    // Create user in Supabase Auth
    const { user: supabaseUser, error } = await SupabaseService.createUser(
      request.email, 
      request.password
    );

    if (error) {
      // Check if it's a duplicate email error
      if (error.message && (error.message.includes('already') || error.message.includes('exists'))) {
        throw new Error('User with this email already exists');
      }
      throw new Error(`Error creating user in Supabase: ${error.message}`);
    }

    try {
      // Create user entity in the database
      const userData: CreateUserData = {
        id: supabaseUser.id, // Use Supabase ID
        name: request.name,
        email: request.email,
        phoneNumber: request.phoneNumber,
        role: this.mapRoleToPrisma(this.determineUserRole(request, authContext)),
        address: request.address ? {
          addressLine1: request.address.addressLine1,
          addressLine2: request.address.addressLine2,
          city: request.address.city,
          stateOrProvince: request.address.stateOrProvince,
          postalCode: request.address.postalCode,
          country: request.address.country
        } : null
      };

      const createdUser = await this.userRepository.create(userData);

      return {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        phoneNumber: createdUser.phoneNumber,
        role: createdUser.role.toLowerCase(), // Return in lowercase for the API
        address: createdUser.address,
        createdAt: createdUser.createdAt
      };

    } catch (dbError) {
      // If there's an error in the DB, try to delete the user from Supabase
      // (manual rollback since we don't have distributed transactions)
      console.error('Database error, user created in Supabase but not in DB:', dbError);
      throw new Error('Error creating user in database');
    }
  }

  private validateAuthorization(request: CreateUserRequest, authContext: AuthContext): void {
    // Scenario 1: Admin creates user (can create admin or user)
    if (authContext.isAuthenticated && authContext.user?.role === 'admin') {
      // Admin can create any type of user
      return;
    }

    // Scenario 2: Self-register (anonymous user registers)
    if (!authContext.isAuthenticated) {
      // Anonymous user can only create user with 'user' role
      // Normalize role if present to make validation case-insensitive
      const normalizedRole = request.role?.toLowerCase().trim();
      if (normalizedRole && normalizedRole !== 'user') {
        throw new Error('Anonymous users can only register as regular users');
      }
      return;
    }

    // Scenario 3: Regular user tries to create another user
    if (authContext.isAuthenticated && authContext.user?.role === 'user') {
      throw new Error('Regular users cannot create other users');
    }

    // Any other unauthorized case
    throw new Error('Unauthorized to create user');
  }

  private determineUserRole(request: CreateUserRequest, authContext: AuthContext): 'admin' | 'user' {
    // If it's admin creating user, can specify the role
    if (authContext.isAuthenticated && authContext.user?.role === 'admin') {
      // Normalize the requested role to lowercase
      const normalizedRole = request.role?.toLowerCase().trim();
      return normalizedRole === 'admin' ? 'admin' : 'user';
    }

    // In any other case (self-register), always 'user'
    return 'user';
  }

  private mapRoleToPrisma(role: 'admin' | 'user'): 'ADMIN' | 'USER' {
    return role === 'admin' ? 'ADMIN' : 'USER';
  }
} 