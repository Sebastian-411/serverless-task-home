import type { UserRepositoryPort } from '../../../../../core/user/domain/ports/out/user-repository.port';
import { ChangeUserRoleUseCase } from '../../../../../core/user/application/change-user-role.usecase';

// Mock dependencies
const mockUserRepository: jest.Mocked<UserRepositoryPort> = {
  findById: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  findAllPaginated: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
  findByIdMinimal: jest.fn(),
  validateUsersForAssignment: jest.fn()
};

describe('ChangeUserRoleUseCase Application Tests', () => {
  let changeUserRoleUseCase: ChangeUserRoleUseCase;

  beforeEach(() => {
    changeUserRoleUseCase = new ChangeUserRoleUseCase(mockUserRepository);
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
          id: 'target-user-id',
          role: 'admin'
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
          id: 'target-user-id',
          role: 'user'
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
            id: 'target-user-id',
            role: 'admin'
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
            id: 'target-user-id',
            role: 'admin'
          },
          unauthenticatedContext
        )
      ).rejects.toThrow('Authentication required');
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

    it('should prevent admin from changing their own role', async () => {
      const targetUser = {
        id: 'admin-id',
        email: 'admin@test.com',
        name: 'Last Admin',
        role: 'ADMIN',
        updatedAt: new Date()
      };

      (mockUserRepository.findById as jest.Mock).mockResolvedValue(targetUser);

      await expect(
        changeUserRoleUseCase.execute(
          {
            id: 'admin-id', // Same as auth context user
            role: 'user'
          },
          adminAuthContext
        )
      ).rejects.toThrow('Role change to user is not allowed for user admin-id');
    });

    it('should allow admin to change other user roles', async () => {
      const targetUser = {
        id: 'other-user-id',
        email: 'other@test.com',
        name: 'Other User',
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
          id: 'other-user-id',
          role: 'admin'
        },
        adminAuthContext
      );

      expect(result.role).toBe('admin');
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
            id: 'non-existent-id',
            role: 'user'
          },
          adminAuthContext
        )
      ).rejects.toThrow('User with id non-existent-id not found');
    });

    it('should handle repository errors', async () => {
      (mockUserRepository.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        changeUserRoleUseCase.execute(
          {
            id: 'target-user-id',
            role: 'user'
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
            id: 'target-user-id',
            role: 'admin'
          },
          adminAuthContext
        )
      ).rejects.toThrow('Error changing user role');
    });

    it('should handle unknown errors gracefully', async () => {
      (mockUserRepository.findById as jest.Mock).mockRejectedValue('Unknown error');

      await expect(
        changeUserRoleUseCase.execute(
          {
            id: 'target-user-id',
            role: 'user'
          },
          adminAuthContext
        )
      ).rejects.toThrow('Error changing user role');
    });
  });
}); 