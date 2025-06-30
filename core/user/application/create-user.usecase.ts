import type { UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import type { AuthServicePort } from '../../auth/domain/ports/out/auth-service.port';
import type { AuthContext } from '../../common/config/middlewares/auth.middleware';
import type { CreateUserData } from '../domain/entities/user.entity';
import { Address } from '../domain/entities/address.entity';
import { UserAlreadyExistsError } from '../domain/user-errors';
import { UnauthorizedError } from '../../common/domain/exceptions/unauthorized.error';

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
  updatedAt: Date;
}

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepositoryPort,
    private authService: AuthServicePort
  ) {}

  /**
   * Creates a new user, handling authorization, normalization, and persistence in Auth and DB.
   *
   * - Handles admin and self-registration scenarios.
   * - Throws if the user already exists or if permissions are insufficient.
   *
   * @param {CreateUserRequest} request - The request containing user data to create.
   * @param {AuthContext} authContext - The authentication context of the current request.
   * @returns {Promise<CreateUserResponse>} The created user data in response format.
   * @throws {UserAlreadyExistsError} If the user already exists.
   * @throws {UnauthorizedError} If authentication or authorization fails.
   * @throws {Error} For unexpected repository or system errors.
   */
  async execute(request: CreateUserRequest, authContext: AuthContext): Promise<CreateUserResponse> {
    console.log('[CreateUserUseCase][execute] Create user request received', { email: request.email, authUserId: authContext?.user?.id, authUserRole: authContext?.user?.role });
    // Step 1: Normalize input data
    const normalizedRequest = this.normalizeInputData(request);

    // Step 2: Validate authorization scenarios
    try {
      this.validateAuthorization(normalizedRequest, authContext);
    } catch (authError) {
      console.warn('[CreateUserUseCase][execute] Validation failed: Authorization error', { email: request.email, error: authError });
      throw authError;
    }

    // Step 3: Create user in Auth Service
    const authUser = await this.authService.createUser(
      normalizedRequest.email,
      normalizedRequest.password
    );

    if (!authUser) {
      console.warn('[CreateUserUseCase][execute] Validation failed: User already exists in Auth Service', { email: normalizedRequest.email });
      throw new UserAlreadyExistsError(normalizedRequest.email);
    }

    try {
      // Step 4: Create user entity in the database
      let address: Address | undefined;
      if (normalizedRequest.address) {
        address = new Address(normalizedRequest.address);
      }
      const userData: CreateUserData = {
        id: authUser.id,
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
        } : undefined
      };
      const createdUser = await this.userRepository.create(userData);
      // Step 5: Return formatted response
      console.log('[CreateUserUseCase][execute] User created successfully', { userId: createdUser.id });
      return this.formatResponse(createdUser);
    } catch (dbError) {
      console.error('[CreateUserUseCase][execute] Database error, user created in Auth Service but not in DB', { email: normalizedRequest.email, error: dbError });
      throw new Error('Error creating user in database');
    }
  }

  /**
   * Normalizes input data for user creation (trims, lowercases, etc).
   *
   * @param {CreateUserRequest} request - The raw user creation request.
   * @returns {CreateUserRequest} The normalized user creation request.
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
   * Formats the user entity into the API response structure.
   *
   * @param {any} user - The user entity from the database.
   * @returns {CreateUserResponse} The formatted user response.
   */
  private formatResponse(user: any): CreateUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role.toLowerCase(),
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Validates authorization for user creation scenarios.
   * Throws if the current context is not allowed to create the user.
   *
   * @param {CreateUserRequest} request - The user creation request.
   * @param {AuthContext} authContext - The authentication context.
   * @throws {UnauthorizedError} If the context is not allowed to create the user.
   */
  private validateAuthorization(request: CreateUserRequest, authContext: AuthContext): void {
    // Scenario 1: Admin creates user (can create admin or user)
    if (authContext.isAuthenticated && authContext.user?.role === 'admin') {
      // Admin can create any type of user
      return;
    }
    // Scenario 2: Self-register (anonymous user registers)
    if (!authContext.isAuthenticated) {
      // Anonymous user can only create user with 'user' role
      const normalizedRole = request.role?.toLowerCase().trim();
      if (normalizedRole && normalizedRole !== 'user') {
        console.warn('[CreateUserUseCase][validateAuthorization] Validation failed: Anonymous users can only register as regular users', { email: request.email });
        throw new UnauthorizedError('Anonymous users can only register as regular users');
      }
      return;
    }
    // Scenario 3: Regular user tries to create another user
    if (authContext.isAuthenticated && authContext.user?.role === 'user') {
      console.warn('[CreateUserUseCase][validateAuthorization] Validation failed: Regular users cannot create other users', { authUserId: authContext.user.id });
      throw new UnauthorizedError('Regular users cannot create other users');
    }
    // Any other unauthorized case
    console.warn('[CreateUserUseCase][validateAuthorization] Validation failed: Unauthorized to create user', { email: request.email });
    throw new UnauthorizedError('Unauthorized to create user');
  }

  /**
   * Determines the user role for creation based on request and context.
   *
   * @param {CreateUserRequest} request - The user creation request.
   * @param {AuthContext} authContext - The authentication context.
   * @returns {'admin' | 'user'} The determined user role.
   */
  private determineUserRole(request: CreateUserRequest, authContext: AuthContext): 'admin' | 'user' {
    if (authContext.isAuthenticated && authContext.user?.role === 'admin') {
      const normalizedRole = request.role?.toLowerCase().trim();
      return normalizedRole === 'admin' ? 'admin' : 'user';
    }
    return 'user';
  }

  /**
   * Maps the user role to the Prisma enum value.
   *
   * @param {'admin' | 'user'} role - The user role.
   * @returns {'ADMIN' | 'USER'} The Prisma enum value.
   */
  private mapRoleToPrisma(role: 'admin' | 'user'): 'ADMIN' | 'USER' {
    return role === 'admin' ? 'ADMIN' : 'USER';
  }
} 