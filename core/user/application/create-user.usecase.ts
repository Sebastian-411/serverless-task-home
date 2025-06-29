import { SupabaseService } from '../../../shared/auth/supabase.service';
import type { CreateUserData } from '../infrastructure/user.repository.prisma';
import type { UserRepository } from '../domain/user.entity';
import type { Address } from '../domain/address.entity';

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
  private userRepository: UserRepository;
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(request: CreateUserRequest, authContext: AuthContext): Promise<CreateUserResponse> {
    // Step 1: Normalize input data
    const normalizedRequest = this.normalizeInputData(request);

    // Step 2: Validate authorization scenarios
    this.validateAuthorization(normalizedRequest, authContext);

    // Step 3: Create user in Supabase Auth
    const { user: supabaseUser, error } = await SupabaseService.createUser(
      normalizedRequest.email, 
      normalizedRequest.password
    );

    if (error) {
      // Check if it's a duplicate email error
      if (error.message && (error.message.includes('already') || error.message.includes('exists'))) {
        throw new Error('User with this email already exists');
      }
      throw new Error(`Error creating user in Supabase: ${error.message}`);
    }

    try {
      // Step 4: Create user entity in the database
      let address: Address | undefined;
      if (normalizedRequest.address) {
        address = new Address(normalizedRequest.address);
      }
      const userData: CreateUserData = {
        id: supabaseUser.id, // Use Supabase ID
        name: normalizedRequest.name,
        email: normalizedRequest.email,
        phoneNumber: normalizedRequest.phoneNumber,
        role: this.mapRoleToPrisma(this.determineUserRole(normalizedRequest, authContext)),
        address: address ? {
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          stateOrProvince: address.stateOrProvince,
          postalCode: address.postalCode,
          country: address.country
        } : null
      };

      const createdUser = await this.userRepository.create(userData);

      // Step 5: Return formatted response
      return this.formatResponse(createdUser);

    } catch (dbError) {
      // If there's an error in the DB, try to delete the user from Supabase
      // (manual rollback since we don't have distributed transactions)
      console.error('Database error, user created in Supabase but not in DB:', dbError);
      throw new Error('Error creating user in database');
    }
  }

  /**
   * Normalize input data - Data transformation logic
   */
  private normalizeInputData(request: CreateUserRequest): CreateUserRequest {
    const normalized = { ...request };

    // Normalize email
    normalized.email = normalized.email.trim().toLowerCase();

    // Normalize role
    if (normalized.role) {
      normalized.role = normalized.role.toLowerCase().trim() as 'admin' | 'user';
    }

    // Normalize text fields
    ['name', 'phoneNumber'].forEach(field => {
      if (normalized[field as keyof CreateUserRequest]) {
        (normalized as any)[field] = (normalized as any)[field].trim();
      }
    });

    // Normalize address fields
    if (normalized.address) {
      ['addressLine1', 'addressLine2', 'city', 'stateOrProvince', 'postalCode', 'country']
        .forEach(field => {
          if (normalized.address![field as keyof typeof normalized.address]) {
            (normalized.address as any)[field] = (normalized.address as any)[field].trim();
          }
        });
    }

    return normalized;
  }

  /**
   * Format response data for API consumption
   */
  private formatResponse(user: any): CreateUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role.toLowerCase(), // Return in lowercase for the API
      address: user.address,
      createdAt: user.createdAt
    };
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