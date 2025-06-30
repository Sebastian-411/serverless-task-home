import type { UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import type { AuthContext } from '../../common/config/middlewares/auth.middleware';
import { UnauthorizedError } from '../../common/domain/exceptions/unauthorized.error';
import { EntityNotFoundError } from '../../common/domain/exceptions/entity-not-found.error';

export interface DeleteUserCommand {
  id: string;
}

export interface DeleteUserUseCase {
  execute(command: DeleteUserCommand, authContext: AuthContext): Promise<void>;
}

export class DeleteUserUseCaseImpl implements DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: DeleteUserCommand, authContext: AuthContext): Promise<void> {
    // Step 1: Authentication check
    if (!authContext.isAuthenticated || !authContext.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Step 2: Authorization check
    // Only admins can delete users
    if (authContext.user.role !== 'admin') {
      throw new UnauthorizedError('Only administrators can delete users');
    }

    // Step 3: Prevent self-deletion
    if (authContext.user.id === command.id) {
      throw new UnauthorizedError('Administrators cannot delete their own account');
    }

    // Step 4: Check if user exists
    const existingUser = await this.userRepository.findById(command.id);
    if (!existingUser) {
      throw new EntityNotFoundError('User', command.id);
    }

    // Step 5: Delete user
    await this.userRepository.delete(command.id);
  }
} 