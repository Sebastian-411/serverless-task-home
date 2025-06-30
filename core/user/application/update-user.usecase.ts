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

  async execute(command: UpdateUserCommand, authContext: AuthContext): Promise<UpdateUserResponse> {
    // Step 1: Authentication check
    if (!authContext.isAuthenticated || !authContext.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Step 2: Authorization check
    // Users can only update their own profile, admins can update any user
    if (authContext.user.role !== 'admin' && authContext.user.id !== command.id) {
      throw new UnauthorizedError('You can only update your own profile');
    }

    // Step 3: Check if user exists
    const existingUser = await this.userRepository.findById(command.id);
    if (!existingUser) {
      throw new EntityNotFoundError('User', command.id);
    }

    // Step 4: Authorization for role changes
    if (command.role && authContext.user.role !== 'admin') {
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
  }
} 