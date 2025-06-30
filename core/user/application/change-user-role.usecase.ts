import type { UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import type { AuthContext } from '../../common/config/middlewares/auth.middleware';
import { UserNotFoundError, UserRoleChangeNotAllowedError } from '../domain/user-errors';
import { UnauthorizedError } from '../../common/domain/exceptions/unauthorized.error';

export interface ChangeUserRoleRequest {
  id: string;
  role: 'admin' | 'user';
}

export interface ChangeUserRoleResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  updatedAt: Date;
}

export class ChangeUserRoleUseCase {
  constructor(private userRepository: UserRepositoryPort) {}

  /**
   * Changes the role of a user, enforcing authentication and authorization rules.
   *
   * - Only administrators can change user roles.
   * - Administrators cannot change their own role.
   * - Throws if the user does not exist or if permissions are insufficient.
   *
   * @param {ChangeUserRoleRequest} request - The request containing the user ID and new role.
   * @param {AuthContext} authContext - The authentication context of the current request.
   * @returns {Promise<ChangeUserRoleResponse>} The updated user data in response format.
   * @throws {UnauthorizedError} If authentication or authorization fails.
   * @throws {UserNotFoundError} If the user does not exist.
   * @throws {UserRoleChangeNotAllowedError} If an admin tries to change their own role.
   * @throws {Error} For unexpected repository or system errors.
   */
  async execute(request: ChangeUserRoleRequest, authContext: AuthContext): Promise<ChangeUserRoleResponse> {
    console.log('[ChangeUserRoleUseCase][execute] Change user role request received', { userId: request.id, newRole: request.role, authUserId: authContext?.user?.id, authUserRole: authContext?.user?.role });
    try {
      // Step 1: Authentication check
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn('[ChangeUserRoleUseCase][execute] Validation failed: Authentication required');
        throw new UnauthorizedError('Authentication required');
      }

      // Step 2: Authorization check - Only administrators can change user roles
      if (authContext.user.role !== 'admin') {
        console.warn('[ChangeUserRoleUseCase][execute] Validation failed: Only administrators can change user roles', { authUserId: authContext.user.id });
        throw new UnauthorizedError('Only administrators can change user roles');
      }

      // Step 3: Check if user exists
      const existingUser = await this.userRepository.findById(request.id);
      if (!existingUser) {
        console.warn('[ChangeUserRoleUseCase][execute] Validation failed: User not found', { userId: request.id });
        throw new UserNotFoundError(request.id);
      }

      // Step 4: Prevent administrators from changing their own role
      if (authContext.user.id === request.id) {
        console.warn('[ChangeUserRoleUseCase][execute] Validation failed: Admin cannot change own role', { authUserId: authContext.user.id });
        throw new UserRoleChangeNotAllowedError(request.id, request.role);
      }

      // Step 5: Update user role
      const updatedUser = await this.userRepository.update(request.id, {
        role: request.role.toUpperCase() as 'ADMIN' | 'USER'
      });

      // Step 6: Return formatted response
      console.log('[ChangeUserRoleUseCase][execute] User role changed successfully', { userId: updatedUser.id, newRole: updatedUser.role });
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.name}`,
        role: updatedUser.role.toLowerCase(),
        updatedAt: new Date(updatedUser.updatedAt)
      };
    } catch (error) {
      console.error('[ChangeUserRoleUseCase][execute] Unexpected error changing user role', { userId: request.id, error });
      // Re-throw domain errors to preserve specific messages
      if (error instanceof UnauthorizedError || error instanceof UserNotFoundError || error instanceof UserRoleChangeNotAllowedError) {
        throw error;
      }
      throw new Error('Error changing user role');
    }
  }
} 