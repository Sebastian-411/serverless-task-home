/**
 * GetUsersUseCase Application Tests
 * Comprehensive testing for users list retrieval with >80% coverage
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { GetUsersUseCase } from '../../../../../core/user/application/get-users.usecase';
import type { UserRepositoryPort } from '../../../../../core/user/domain/ports/out/user-repository.port';
import type { AuthContext } from '../../../../../core/common/config/middlewares/auth.middleware';

describe('GetUsersUseCase Application Tests', () => {
  let getUsersUseCase: GetUsersUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  beforeEach(() => {
    // Clear all mocks and cache
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // Create fresh mocked repository
    mockUserRepository = {
      findAllPaginated: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByIdMinimal: jest.fn(),
      validateUsersForAssignment: jest.fn()
    };

    getUsersUseCase = new GetUsersUseCase(mockUserRepository);
  });

  // Helper function to create mock user data
  const createMockUser = (overrides: any = {}) => ({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    role: 'USER',
    address: {
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      stateOrProvince: 'NY',
      postalCode: '10001',
      country: 'USA'
    },
    createdAt: new Date('2024-01-01'),
    ...overrides
  });

  const mockUsers = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      role: 'USER',
      address: {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        stateOrProvince: 'NY',
        postalCode: '10001',
        country: 'USA'
      },
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      phoneNumber: '+1987654321',
      role: 'ADMIN',
      address: null,
      createdAt: new Date('2024-01-02')
    }
  ];

  const adminAuthContext: AuthContext = {
    user: {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin'
    },
    isAuthenticated: true
  };

  const userAuthContext: AuthContext = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      role: 'user'
    },
    isAuthenticated: true
  };

  const unauthenticatedContext: AuthContext = {
    isAuthenticated: false
  };

  describe('Admin Access', () => {
    it('should allow admin to get all users', async () => {
      mockUserRepository.findAllPaginated.mockResolvedValueOnce(mockUsers as any);
      mockUserRepository.count.mockResolvedValueOnce(2);

      const result = await getUsersUseCase.execute(adminAuthContext, { page: 1, limit: 10 });

      expect(mockUserRepository.findAllPaginated).toHaveBeenCalledWith(0, 10);
      expect(mockUserRepository.count).toHaveBeenCalled();
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.users[0]).toEqual({
        id: mockUsers[0].id,
        email: mockUsers[0].email,
        name: mockUsers[0].name,
        phoneNumber: mockUsers[0].phoneNumber,
        role: 'user', // Converted to lowercase
        address: mockUsers[0].address,
        createdAt: mockUsers[0].createdAt
      });
      expect(result.users[1]).toEqual({
        id: mockUsers[1].id,
        email: mockUsers[1].email,
        name: mockUsers[1].name,
        phoneNumber: mockUsers[1].phoneNumber,
        role: 'admin', // Converted to lowercase
        address: undefined, // null converted to undefined
        createdAt: mockUsers[1].createdAt
      });
    });

    it('should handle empty users list', async () => {
      mockUserRepository.findAllPaginated.mockResolvedValueOnce([]);
      mockUserRepository.count.mockResolvedValueOnce(0);

      const result = await getUsersUseCase.execute(adminAuthContext, { page: 2, limit: 10 }); // Use page 2 to bypass cache

      expect(mockUserRepository.findAllPaginated).toHaveBeenCalledWith(10, 10);
      expect(mockUserRepository.count).toHaveBeenCalled();
      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should properly transform user roles from uppercase to lowercase', async () => {
      const usersWithMixedRoles = [
        { ...mockUsers[0], role: 'USER' },
        { ...mockUsers[1], role: 'ADMIN' }
      ];
      mockUserRepository.findAllPaginated.mockResolvedValueOnce(usersWithMixedRoles as any);
      mockUserRepository.count.mockResolvedValueOnce(2);

      const result = await getUsersUseCase.execute(adminAuthContext, { page: 1, limit: 10 });

      expect(result.users[0].role).toBe('user');
      expect(result.users[1].role).toBe('admin');
    });

    it('should handle users without addresses correctly', async () => {
      const usersWithoutAddress = mockUsers.map(user => ({ ...user, address: null }));
      mockUserRepository.findAllPaginated.mockResolvedValueOnce(usersWithoutAddress as any);
      mockUserRepository.count.mockResolvedValueOnce(2);

      const result = await getUsersUseCase.execute(adminAuthContext, { page: 2, limit: 10 }); // Use page 2 to bypass cache

      result.users.forEach(user => {
        expect(user.address).toBeUndefined();
      });
    });
  });

  describe('Authorization Validation', () => {
    it('should prevent regular user from accessing users list', async () => {
      await expect(getUsersUseCase.execute(userAuthContext, { page: 1, limit: 10 }))
        .rejects.toThrow('Only administrators can access the users list');

      expect(mockUserRepository.findAllPaginated).not.toHaveBeenCalled();
    });

    it('should prevent unauthenticated user from accessing users list', async () => {
      await expect(getUsersUseCase.execute(unauthenticatedContext, { page: 1, limit: 10 }))
        .rejects.toThrow('Authentication required');

      expect(mockUserRepository.findAllPaginated).not.toHaveBeenCalled();
    });

    it('should prevent authenticated user without user context from accessing users list', async () => {
      const contextWithoutUser: AuthContext = {
        isAuthenticated: true
      };

      await expect(getUsersUseCase.execute(contextWithoutUser, { page: 1, limit: 10 }))
        .rejects.toThrow('Authentication required');

      expect(mockUserRepository.findAllPaginated).not.toHaveBeenCalled();
    });

    it('should prevent authenticated user with non-admin role from accessing users list', async () => {
      const nonAdminContext: AuthContext = {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'user'
        },
        isAuthenticated: true
      };

      await expect(getUsersUseCase.execute(nonAdminContext, { page: 1, limit: 10 }))
        .rejects.toThrow('Only administrators can access the users list');

      expect(mockUserRepository.findAllPaginated).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockUserRepository.findAllPaginated.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(getUsersUseCase.execute(adminAuthContext, { page: 2, limit: 10 })) // Use page 2 to bypass cache
        .rejects.toThrow('Error retrieving users list');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[GetUsersUseCase][execute] Unexpected error retrieving users list',
        expect.objectContaining({
          error: expect.any(Error)
        })
      );

      consoleSpy.mockRestore();
    });

    it('should preserve authorization error message', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(getUsersUseCase.execute(userAuthContext, { page: 1, limit: 10 }))
        .rejects.toThrow('Only administrators can access the users list');

      // Authorization errors are logged for security audit purposes
      expect(consoleSpy).toHaveBeenCalledWith(
        '[GetUsersUseCase][execute] Unexpected error retrieving users list',
        expect.objectContaining({
          error: expect.any(Error)
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle unknown errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate a non-Error object being thrown
      mockUserRepository.findAllPaginated.mockRejectedValueOnce('String error');

      await expect(getUsersUseCase.execute(adminAuthContext, { page: 2, limit: 10 })) // Use page 2 to bypass cache
        .rejects.toThrow('Error retrieving users list');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[GetUsersUseCase][execute] Unexpected error retrieving users list',
        expect.objectContaining({
          error: 'String error'
        })
      );

      consoleSpy.mockRestore();
    });
  });
}); 