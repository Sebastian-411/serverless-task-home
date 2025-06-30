import type { UserRepositoryPort } from '../domain/ports/out/user-repository.port';
import type { AuthContext } from '../../common/config/middlewares/auth.middleware';
import { UnauthorizedError } from '../../common/domain/exceptions/unauthorized.error';
import { EntityNotFoundError } from '../../common/domain/exceptions/entity-not-found.error';

export interface UpdateUserCommand {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserResponse {
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

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Updates a user's profile or role, enforcing authentication and authorization rules.
   *
   * - Only authenticated users can update their own profile.
   * - Only admins can update any user or change user roles.
   * - Throws if the user does not exist or if permissions are insufficient.
   *
   * @param {UpdateUserCommand} command - The update command containing user fields to update.
   * @param {AuthContext} authContext - The authentication context of the current request.
   * @returns {Promise<UpdateUserResponse>} The updated user data in response format.
   * @throws {UnauthorizedError} If authentication or authorization fails.
   * @throws {EntityNotFoundError} If the user does not exist.
   * @throws {Error} For unexpected repository or system errors.
   */
  async execute(command: UpdateUserCommand, authContext: AuthContext): Promise<UpdateUserResponse> {
    console.log('[UpdateUserUseCase][execute] Update user request received', { userId: command.id, authUserId: authContext?.user?.id, authUserRole: authContext?.user?.role });
    try {
      // Step 1: Authentication check
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn('[UpdateUserUseCase][execute] Validation failed: Authentication required');
        throw new UnauthorizedError('Authentication required');
      }

      // Step 2: Authorization check
      if (authContext.user.role !== 'admin' && authContext.user.id !== command.id) {
        console.warn('[UpdateUserUseCase][execute] Validation failed: User can only update own profile', { authUserId: authContext.user.id, targetUserId: command.id });
        throw new UnauthorizedError('You can only update your own profile');
      }

      // Step 3: Check if user exists
      const existingUser = await this.userRepository.findById(command.id);
      if (!existingUser) {
        console.warn('[UpdateUserUseCase][execute] Validation failed: User not found', { userId: command.id });
        throw new EntityNotFoundError('User', command.id);
      }

      // Step 4: Authorization for role changes
      if (command.role && authContext.user.role !== 'admin') {
        console.warn('[UpdateUserUseCase][execute] Validation failed: Only admin can change user roles', { authUserId: authContext.user.id });
        throw new UnauthorizedError('Only administrators can change user roles');
      }

      // Step 5: Prepare update data
      const updateData: any = {};
      if (command.name) updateData.name = command.name;
      if (command.email) updateData.email = command.email;
      if (command.phoneNumber) updateData.phoneNumber = command.phoneNumber;
      if (command.role) updateData.role = command.role.toUpperCase() as 'ADMIN' | 'USER';

      // Step 6: Update user in repository
      const updatedUser = await this.userRepository.update(command.id, updateData);

      // Step 7: Return formatted response
      console.log('[UpdateUserUseCase][execute] User updated successfully', { userId: command.id });
      return {
        id: (updatedUser as any).id,
        email: (updatedUser as any).email,
        name: (updatedUser as any).name,
        phoneNumber: (updatedUser as any).phoneNumber || '',
        role: (updatedUser as any).role.toLowerCase(),
        address: (updatedUser as any).address ? {
          addressLine1: (updatedUser as any).address.addressLine1,
          addressLine2: (updatedUser as any).address.addressLine2,
          city: (updatedUser as any).address.city,
          stateOrProvince: (updatedUser as any).address.stateOrProvince,
          postalCode: (updatedUser as any).address.postalCode,
          country: (updatedUser as any).address.country
        } : undefined,
        createdAt: new Date((updatedUser as any).createdAt),
        updatedAt: new Date((updatedUser as any).updatedAt)
      };
    } catch (error) {
      console.error('[UpdateUserUseCase][execute] Unexpected error during user update', { userId: command.id, error });
      throw error;
    }
  }
} 