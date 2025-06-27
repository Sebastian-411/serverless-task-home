import { ChangeUserRoleUseCase } from '../../../../../core/user/application/change-user-role.usecase';
import { UserRepository } from '../../../../../core/user/infrastructure/user.repository.prisma';
import { PrismaClient } from '../../../../../lib/generated/prisma';

// Mock dependencies
const mockUserRepository = {
  findById: jest.fn(),
  update: jest.fn(),
} as unknown as UserRepository;

const mockPrisma = {
  user: {
    count: jest.fn(),
  },
} as unknown as PrismaClient;

describe('ChangeUserRoleUseCase Application Tests', () => {
  let changeUserRoleUseCase: ChangeUserRoleUseCase;

  beforeEach(() => {
    changeUserRoleUseCase = new ChangeUserRoleUseCase(mockUserRepository, mockPrisma);
    jest.clearAllMocks();
  });

  describe('Admin Role Change Scenarios', () => {
    const adminAuthContext = {
      isAuthenticated: true,
      user: {
        id: 'admin-id',
        email: 'admin@test.com',
        role: 'admin' as const
      }
    };

    it('should allow admin to change user role to admin', async () => {
      const targetUser = {
        id: 'target-user-id',
        email: 'user@test.com',
        name: 'Test User',
        role: 'USER',
        updatedAt: new Date()
      };

      const updatedUser = {
        ...targetUser,
        role: 'ADMIN',
        updatedAt: new Date()
      };

      (mockUserRepository.findById as jest.Mock).mockResolvedValue(targetUser);
      (mockUserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await changeUserRoleUseCase.execute(
        {
          targetUserId: 'target-user-id',
          newRole: 'admin'
        },
        adminAuthContext
      );

      expect(result.role).toBe('admin');
      expect(mockUserRepository.update).toHaveBeenCalledWith('target-user-id', {
        role: 'ADMIN'
      });
    });

    it('should allow admin to change user role to user', async () => {
      const targetUser = {
        id: 'target-user-id',
        email: 'admin2@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        updatedAt: new Date()
      };

      const updatedUser = {
        ...targetUser,
        role: 'USER',
        updatedAt: new Date()
      };

      (mockUserRepository.findById as jest.Mock).mockResolvedValue(targetUser);
      (mockUserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await changeUserRoleUseCase.execute(
        {
          targetUserId: 'target-user-id',
          newRole: 'user'
        },
        adminAuthContext
      );

      expect(result.role).toBe('user');
      expect(mockUserRepository.update).toHaveBeenCalledWith('target-user-id', {
        role: 'USER'
      });
    });
  });

  describe('Authorization Validation', () => {
    it('should prevent regular user from changing roles', async () => {
      const userAuthContext = {
        isAuthenticated: true,
        user: {
          id: 'user-id',
          email: 'user@test.com',
          role: 'user' as const
        }
      };

      await expect(
        changeUserRoleUseCase.execute(
          {
            targetUserId: 'target-user-id',
            newRole: 'admin'
          },
          userAuthContext
        )
      ).rejects.toThrow('Only administrators can change user roles');
    });

    it('should prevent unauthenticated user from changing roles', async () => {
      const unauthenticatedContext = {
        isAuthenticated: false,
        user: {
          id: 'user-id',
          email: 'user@test.com',
          role: 'user' as const
        }
      };

      await expect(
        changeUserRoleUseCase.execute(
          {
            targetUserId: 'target-user-id',
            newRole: 'admin'
          },
          unauthenticatedContext
        )
      ).rejects.toThrow('Only administrators can change user roles');
    });
  });

  describe('Business Rules', () => {
    const adminAuthContext = {
      isAuthenticated: true,
      user: {
        id: 'admin-id',
        email: 'admin@test.com',
        role: 'admin' as const
      }
    };

    it('should prevent last admin from removing their own admin role', async () => {
      const targetUser = {
        id: 'admin-id',
        email: 'admin@test.com',
        name: 'Last Admin',
        role: 'ADMIN',
        updatedAt: new Date()
      };

      (mockUserRepository.findById as jest.Mock).mockResolvedValue(targetUser);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(1); // Only 1 admin

      await expect(
        changeUserRoleUseCase.execute(
          {
            targetUserId: 'admin-id', // Same as auth context user
            newRole: 'user'
          },
          adminAuthContext
        )
      ).rejects.toThrow('Cannot remove admin role from the last administrator in the system');
    });

    it('should allow admin to change their own role when there are other admins', async () => {
      const targetUser = {
        id: 'admin-id',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
        updatedAt: new Date()
      };

      const updatedUser = {
        ...targetUser,
        role: 'USER',
        updatedAt: new Date()
      };

      (mockUserRepository.findById as jest.Mock).mockResolvedValue(targetUser);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(2); // Multiple admins
      (mockUserRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await changeUserRoleUseCase.execute(
        {
          targetUserId: 'admin-id',
          newRole: 'user'
        },
        adminAuthContext
      );

      expect(result.role).toBe('user');
    });
  });

  describe('Error Handling', () => {
    const adminAuthContext = {
      isAuthenticated: true,
      user: {
        id: 'admin-id',
        email: 'admin@test.com',
        role: 'admin' as const
      }
    };

    it('should handle user not found', async () => {
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        changeUserRoleUseCase.execute(
          {
            targetUserId: 'non-existent-id',
            newRole: 'user'
          },
          adminAuthContext
        )
      ).rejects.toThrow('User not found');
    });

    it('should handle repository errors', async () => {
      (mockUserRepository.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        changeUserRoleUseCase.execute(
          {
            targetUserId: 'target-user-id',
            newRole: 'user'
          },
          adminAuthContext
        )
      ).rejects.toThrow('Error changing user role');
    });

    it('should preserve specific error messages', async () => {
      const targetUser = {
        id: 'target-user-id',
        email: 'user@test.com',
        name: 'Test User',
        role: 'USER',
        updatedAt: new Date()
      };

      (mockUserRepository.findById as jest.Mock).mockResolvedValue(targetUser);
      (mockUserRepository.update as jest.Mock).mockRejectedValue(new Error('User not found'));

      await expect(
        changeUserRoleUseCase.execute(
          {
            targetUserId: 'target-user-id',
            newRole: 'admin'
          },
          adminAuthContext
        )
      ).rejects.toThrow('User not found');
    });

    it('should handle unknown errors gracefully', async () => {
      (mockUserRepository.findById as jest.Mock).mockRejectedValue('Unknown error');

      await expect(
        changeUserRoleUseCase.execute(
          {
            targetUserId: 'target-user-id',
            newRole: 'user'
          },
          adminAuthContext
        )
      ).rejects.toThrow('Error changing user role');
    });
  });
}); 