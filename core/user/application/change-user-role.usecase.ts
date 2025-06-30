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

  async execute(request: ChangeUserRoleRequest, authContext: AuthContext): Promise<ChangeUserRoleResponse> {
    try {
      // Step 1: Authentication check
      if (!authContext.isAuthenticated || !authContext.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Step 2: Authorization check - Only administrators can change user roles
      if (authContext.user.role !== 'admin') {
        throw new UnauthorizedError('Only administrators can change user roles');
      }

      // Step 3: Check if user exists
      const existingUser = await this.userRepository.findById(request.id);
      if (!existingUser) {
        throw new UserNotFoundError(request.id);
      }

      // Step 4: Prevent administrators from changing their own role
      if (authContext.user.id === request.id) {
        throw new UserRoleChangeNotAllowedError(request.id, request.role);
      }

      // Step 5: Update user role
      const updatedUser = await this.userRepository.update(request.id, {
        role: request.role.toUpperCase() as 'ADMIN' | 'USER'
      });

      // Step 6: Return formatted response
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.name}`,
        role: updatedUser.role.toLowerCase(),
        updatedAt: new Date(updatedUser.updatedAt)
      };
    } catch (error) {
      console.error('Error in ChangeUserRoleUseCase:', error);
      
      // Re-throw domain errors to preserve specific messages
      if (error instanceof UnauthorizedError || error instanceof UserNotFoundError || error instanceof UserRoleChangeNotAllowedError) {
        throw error;
      }
      
      throw new Error('Error changing user role');
    }
  }
} 