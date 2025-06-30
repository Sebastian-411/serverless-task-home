import type { UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import type { AuthContext } from '../../common/config/middlewares/auth.middleware';
import { UserNotFoundError } from '../domain/user-errors';
import { UnauthorizedError } from '../../common/domain/exceptions/unauthorized.error';

export interface GetUserByIdRequest {
  id: string;
}

export interface GetUserByIdResponse {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class GetUserByIdUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Retrieves a user by their ID, enforcing authentication and authorization rules.
   *
   * - Regular users can only view their own profile.
   * - Administrators can view any profile.
   * - Throws if the user does not exist or if permissions are insufficient.
   *
   * @param {GetUserByIdRequest} request - The request containing the user ID to retrieve.
   * @param {AuthContext} authContext - The authentication context of the current request.
   * @returns {Promise<GetUserByIdResponse>} The user data in response format.
   * @throws {UnauthorizedError} If authentication or authorization fails.
   * @throws {UserNotFoundError} If the user does not exist.
   * @throws {Error} For unexpected repository or system errors.
   */
  async execute(request: GetUserByIdRequest, authContext: AuthContext): Promise<GetUserByIdResponse> {
    console.log('[GetUserByIdUseCase][execute] Get user by ID request received', { requestedUserId: request.id, authUserId: authContext?.user?.id, authUserRole: authContext?.user?.role });
    try {
      // Step 1: Authentication check
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn('[GetUserByIdUseCase][execute] Validation failed: Authentication required');
        throw new UnauthorizedError('Authentication required to access user information');
      }

      const authenticatedUser = authContext.user;

      // Step 2: Authorization check
      if (authenticatedUser.role === 'user' && authenticatedUser.id !== request.id) {
        console.warn('[GetUserByIdUseCase][execute] ACCESS DENIED: User tried to access another user profile', { authUserId: authenticatedUser.id, requestedUserId: request.id });
        throw new UnauthorizedError('Users can only access their own profile');
      }

      // Step 3: Get user from repository
      const user = await this.userRepository.findById(request.id);
      if (!user) {
        console.warn('[GetUserByIdUseCase][execute] Validation failed: User not found', { requestedUserId: request.id });
        throw new UserNotFoundError(request.id);
      }

      // Step 4: Return formatted response
      console.log('[GetUserByIdUseCase][execute] User retrieved successfully', { requestedUserId: request.id });
      return {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).name,
        phoneNumber: (user as any).phoneNumber || '',
        role: (user as any).role.toLowerCase(),
        address: (user as any).address ? {
          addressLine1: (user as any).address.addressLine1,
          addressLine2: (user as any).address.addressLine2,
          city: (user as any).address.city,
          stateOrProvince: (user as any).address.stateOrProvince,
          postalCode: (user as any).address.postalCode,
          country: (user as any).address.country
        } : undefined,
        createdAt: new Date((user as any).createdAt),
        updatedAt: new Date((user as any).updatedAt)
      };
    } catch (error) {
      console.error('[GetUserByIdUseCase][execute] Unexpected error retrieving user by ID', { requestedUserId: request.id, error });
      // Re-throw domain errors to preserve specific messages
      if (error instanceof UnauthorizedError || error instanceof UserNotFoundError) {
        throw error;
      }
      throw new Error('Error retrieving user information');
    }
  }
} 