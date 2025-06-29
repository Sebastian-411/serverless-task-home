/**
 * GetUsersUseCase Application Tests
 * Comprehensive testing for users list retrieval with >80% coverage
 */

import { GetUsersUseCase } from '../../../../../core/user/application/get-users.usecase';
import type { UserRepositoryPrisma } from '../../../../../core/user/infrastructure/user.repository.prisma';
import { Cache } from '../../../../../shared/cache/cache.service';
import { UserRepository } from '../../../../../core/user/domain/user.repository';
import { User } from '../../../../../core/user/domain/user.entity';
import { createMockUserRepository } from '../../../mocks/repositories/user.repository.mock';

// Define AuthContext locally since it's not properly exported
interface AuthContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
}

// Mock the cache service completely
jest.mock('../../../../../shared/cache/cache.service', () => ({
  Cache: {
    get: jest.fn(),
    setHot: jest.fn(),
    setWarm: jest.fn(),
    clear: jest.fn(),
  },
  CacheKeys: {
    userList: jest.fn(() => 'users:all'),
    user: jest.fn((userId: string) => `user:${userId}`),
  },
}));

// Mock the repository
jest.mock('../../../../../core/user/infrastructure/user.repository.prisma');

describe('GetUsersUseCase Application Tests', () => {
  let getUsersUseCase: GetUsersUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryPrisma>;

  beforeEach(() => {
    // Clear all mocks and cache
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // Reset cache mocks - ensure cache always returns null (cache miss)
    (Cache.get as jest.Mock).mockReturnValue(null);
    (Cache.setWarm as jest.Mock).mockResolvedValue(undefined);
    
    // Create fresh mocked repository
    mockUserRepository = {
      findAllPaginated: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

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
      mockUserRepository.findAllPaginated.mockResolvedValueOnce(mockUsers);
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

      const result = await getUsersUseCase.execute(adminAuthContext, { page: 1, limit: 10 });

      expect(mockUserRepository.findAllPaginated).toHaveBeenCalledWith(0, 10);
      expect(mockUserRepository.count).toHaveBeenCalled();
      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should properly transform user roles from uppercase to lowercase', async () => {
      const usersWithMixedRoles = [
        { ...mockUsers[0], role: 'USER' },
        { ...mockUsers[1], role: 'ADMIN' }
      ];
      mockUserRepository.findAllPaginated.mockResolvedValueOnce(usersWithMixedRoles);
      mockUserRepository.count.mockResolvedValueOnce(2);

      const result = await getUsersUseCase.execute(adminAuthContext, { page: 1, limit: 10 });

      expect(result.users[0].role).toBe('user');
      expect(result.users[1].role).toBe('admin');
    });

    it('should handle users without addresses correctly', async () => {
      const usersWithoutAddress = mockUsers.map(user => ({ ...user, address: null }));
      mockUserRepository.findAllPaginated.mockResolvedValueOnce(usersWithoutAddress);
      mockUserRepository.count.mockResolvedValueOnce(2);

      const result = await getUsersUseCase.execute(adminAuthContext, { page: 1, limit: 10 });

      result.users.forEach(user => {
        expect(user.address).toBeUndefined();
      });
    });
  });

  describe('Authorization Validation', () => {
    it('should prevent regular user from accessing users list', async () => {
      await expect(getUsersUseCase.execute(userAuthContext))
        .rejects.toThrow('Only administrators can access the users list');

      expect(mockUserRepository.findAllPaginated).not.toHaveBeenCalled();
    });

    it('should prevent unauthenticated user from accessing users list', async () => {
      await expect(getUsersUseCase.execute(unauthenticatedContext))
        .rejects.toThrow('Only administrators can access the users list');

      expect(mockUserRepository.findAllPaginated).not.toHaveBeenCalled();
    });

    it('should prevent authenticated user without user context from accessing users list', async () => {
      const contextWithoutUser: AuthContext = {
        isAuthenticated: true
      };

      await expect(getUsersUseCase.execute(contextWithoutUser))
        .rejects.toThrow('Only administrators can access the users list');

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

      await expect(getUsersUseCase.execute(nonAdminContext))
        .rejects.toThrow('Only administrators can access the users list');

      expect(mockUserRepository.findAllPaginated).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockUserRepository.findAllPaginated.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(getUsersUseCase.execute(adminAuthContext))
        .rejects.toThrow('Error retrieving users list');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in GetUsersUseCase:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should preserve authorization error message', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await expect(getUsersUseCase.execute(userAuthContext))
        .rejects.toThrow('Only administrators can access the users list');

      // Authorization errors are logged for security audit purposes
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in GetUsersUseCase:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle unknown errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate a non-Error object being thrown
      mockUserRepository.findAllPaginated.mockRejectedValueOnce('String error');

      await expect(getUsersUseCase.execute(adminAuthContext))
        .rejects.toThrow('Error retrieving users list');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in GetUsersUseCase:',
        'String error'
      );

      consoleSpy.mockRestore();
    });
  });
}); 