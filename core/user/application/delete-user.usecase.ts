import type { UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import type { AuthContext } from '../../common/config/middlewares/auth.middleware';
import { UnauthorizedError } from '../../common/domain/exceptions/unauthorized.error';
import { EntityNotFoundError } from '../../common/domain/exceptions/entity-not-found.error';
import type { AuthServicePort } from '../../auth/domain/ports/out/auth-service.port';

export interface DeleteUserCommand {
  id: string;
}

export interface DeleteUserUseCase {
  execute(command: DeleteUserCommand, authContext: AuthContext): Promise<void>;
}

export class DeleteUserUseCaseImpl implements DeleteUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly authService: AuthServicePort
  ) {}

  /**
   * Deletes a user by ID, enforcing authentication and authorization rules.
   *
   * - Only administrators can delete users.
   * - Administrators cannot delete their own account.
   * - Deletes user from Auth/Storage and local database.
   *
   * @param {DeleteUserCommand} command - The command containing the user ID to delete.
   * @param {AuthContext} authContext - The authentication context of the current request.
   * @returns {Promise<void>} Resolves when the user is deleted.
   * @throws {UnauthorizedError} If authentication or authorization fails.
   * @throws {EntityNotFoundError} If the user does not exist.
   * @throws {Error} For unexpected repository or system errors.
   */
  async execute(command: DeleteUserCommand, authContext: AuthContext): Promise<void> {
    console.log('[DeleteUserUseCaseImpl][execute] Delete user request received', { userId: command.id, authUserId: authContext?.user?.id, authUserRole: authContext?.user?.role });
    try {
      // Step 1: Authentication check
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn('[DeleteUserUseCaseImpl][execute] Validation failed: Authentication required');
        throw new UnauthorizedError('Authentication required');
      }

      // Step 2: Authorization check
      if (authContext.user.role !== 'admin') {
        console.warn('[DeleteUserUseCaseImpl][execute] Validation failed: Only administrators can delete users', { authUserId: authContext.user.id });
        throw new UnauthorizedError('Only administrators can delete users');
      }

      // Step 3: Prevent self-deletion
      if (authContext.user.id === command.id) {
        console.warn('[DeleteUserUseCaseImpl][execute] Validation failed: Administrators cannot delete their own account', { authUserId: authContext.user.id });
        throw new UnauthorizedError('Administrators cannot delete their own account');
      }

      // Step 4: Check if user exists
      const existingUser = await this.userRepository.findById(command.id);
      if (!existingUser) {
        console.warn('[DeleteUserUseCaseImpl][execute] Validation failed: User not found', { userId: command.id });
        throw new EntityNotFoundError('User', command.id);
      }

      // Step 5: Delete user from Auth (includes Storage cleanup)
      console.log('[DeleteUserUseCaseImpl][execute] Deleting user from Auth and Storage', { userId: command.id });
      const authDeleted = await this.authService.deleteUser(command.id);
      if (!authDeleted) {
        console.warn('[DeleteUserUseCaseImpl][execute] Warning: User could not be deleted from Auth/Storage', { userId: command.id });
      } else {
        console.log('[DeleteUserUseCaseImpl][execute] User deleted from Auth and Storage', { userId: command.id });
      }

      // Step 6: Delete user from local database
      await this.userRepository.delete(command.id);
      console.log('[DeleteUserUseCaseImpl][execute] User deleted from local database', { userId: command.id });
    } catch (error) {
      console.error('[DeleteUserUseCaseImpl][execute] Unexpected error during user deletion', { userId: command.id, error });
      throw error;
    }
  }
} 