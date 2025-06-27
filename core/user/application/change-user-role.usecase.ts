import { UserRepository } from '../domain/user.entity';
import { PrismaClient } from '@prisma/client';

export interface ChangeUserRoleRequest {
  targetUserId: string;
  newRole: 'admin' | 'user';
}

export interface ChangeUserRoleResponse {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  updatedAt: Date;
}

export interface AuthContext {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
}

export class ChangeUserRoleUseCase {
  constructor(
    private userRepository: UserRepository,
    private prisma: PrismaClient
  ) {}

  async execute(request: ChangeUserRoleRequest, authContext: AuthContext): Promise<ChangeUserRoleResponse> {
    try {
      // Validate authorization - only admins can change roles
      if (!authContext.isAuthenticated || !authContext.user || authContext.user.role !== 'admin') {
        throw new Error('Only administrators can change user roles');
      }

      // Normalize role input
      const normalizedRole = request.newRole.toLowerCase().trim() as 'admin' | 'user';

      // Check if target user exists
      const targetUser = await this.userRepository.findById(request.targetUserId);
      if (!targetUser) {
        throw new Error('User not found');
      }

      // Business rule: Prevent last admin from removing their own admin role
      if (authContext.user.id === request.targetUserId && 
          targetUser.role.toLowerCase() === 'admin' && 
          normalizedRole === 'user') {
        
        const adminCount = await this.prisma.user.count({ 
          where: { role: 'ADMIN' } 
        });
        
        if (adminCount <= 1) {
          throw new Error('Cannot remove admin role from the last administrator in the system');
        }
      }

      // Update user role
      const updatedUser = await this.userRepository.update(request.targetUserId, {
        role: normalizedRole.toUpperCase() as 'ADMIN' | 'USER'
      });

      // Return formatted response
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role.toLowerCase() as 'admin' | 'user',
        updatedAt: updatedUser.updatedAt
      };

    } catch (error) {
      console.error('Error in ChangeUserRoleUseCase:', error);
      
      // Re-throw specific errors to preserve their messages
      if (error instanceof Error) {
        if (error.message === 'User not found' ||
            error.message === 'Only administrators can change user roles' ||
            error.message === 'Cannot remove admin role from the last administrator in the system') {
          throw error;
        }
      }
      
      throw new Error('Error changing user role');
    }
  }
} 