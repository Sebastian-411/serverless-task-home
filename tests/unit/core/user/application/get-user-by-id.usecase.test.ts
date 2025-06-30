/**
 * GetUserByIdUseCase Application Tests
 * Comprehensive testing for user retrieval with >80% coverage
 */

import { GetUserByIdUseCase } from '../../../../../core/user/application/get-user-by-id.usecase';
import type { UserRepositoryPort } from '../../../../../core/user/domain/ports/out/user-repository.port';
import type { AuthContext } from '../../../../../core/common/config/middlewares/auth.middleware';

describe('GetUserByIdUseCase Application Tests', () => {
  let getUserByIdUseCase: GetUserByIdUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAllPaginated: jest.fn(),
      count: jest.fn(),
      findByIdMinimal: jest.fn(),
      validateUsersForAssignment: jest.fn()
    };
    
    getUserByIdUseCase = new GetUserByIdUseCase(mockUserRepository);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  const mockUser = {
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
  };

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

  const anotherUserAuthContext: AuthContext = {
    user: {
      id: 'user-2',
      email: 'user2@example.com',
      role: 'user'
    },
    isAuthenticated: true
  };

  const unauthenticatedContext: AuthContext = {
    isAuthenticated: false
  };

  describe('Admin User Access', () => {
    it('should allow admin to access any user profile', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser as any);

      const result = await getUserByIdUseCase.execute({ id: 'user-1' }, adminAuthContext);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        phoneNumber: mockUser.phoneNumber,
        role: 'user', // Returned in lowercase
        address: mockUser.address,
        createdAt: mockUser.createdAt,
        updatedAt: expect.any(Date)
      });
    });

    it('should allow admin to access user profile without address', async () => {
      const userWithoutAddress = { ...mockUser, address: null };
      mockUserRepository.findById.mockResolvedValueOnce(userWithoutAddress as any);

      const result = await getUserByIdUseCase.execute({ id: 'user-1' }, adminAuthContext);

      expect(result).toEqual({
        id: userWithoutAddress.id,
        email: userWithoutAddress.email,
        name: userWithoutAddress.name,
        phoneNumber: userWithoutAddress.phoneNumber,
        role: 'user',
        address: undefined,
        createdAt: userWithoutAddress.createdAt,
        updatedAt: expect.any(Date)
      });
    });

    it('should handle admin role case conversion correctly', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      mockUserRepository.findById.mockResolvedValueOnce(adminUser as any);

      const result = await getUserByIdUseCase.execute({ id: 'admin-1' }, adminAuthContext);

      expect(result.role).toBe('admin');
    });
  });

  describe('User Self-Access', () => {
    it('should allow user to access their own profile', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(mockUser as any);

      const result = await getUserByIdUseCase.execute({ id: 'user-1' }, userAuthContext);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        phoneNumber: mockUser.phoneNumber,
        role: 'user',
        address: mockUser.address,
        createdAt: mockUser.createdAt,
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('Access Control Validation', () => {
    it('should prevent regular user from accessing another user profile', async () => {
      await expect(getUserByIdUseCase.execute({ id: 'user-1' }, anotherUserAuthContext))
        .rejects.toThrow('Users can only access their own profile');

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await expect(getUserByIdUseCase.execute({ id: 'user-1' }, unauthenticatedContext))
        .rejects.toThrow('Authentication required to access user information');

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should require authenticated user context', async () => {
      const contextWithoutUser: AuthContext = {
        isAuthenticated: true
      };

      await expect(getUserByIdUseCase.execute({ id: 'user-1' }, contextWithoutUser))
        .rejects.toThrow('Authentication required to access user information');

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle user not found', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      await expect(getUserByIdUseCase.execute({ id: 'non-existent-id' }, adminAuthContext))
        .rejects.toThrow('User with id non-existent-id not found');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should handle repository errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockUserRepository.findById.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(getUserByIdUseCase.execute({ id: 'user-1' }, adminAuthContext))
        .rejects.toThrow('Error retrieving user information');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[GetUserByIdUseCase][execute] Unexpected error retrieving user by ID',
        expect.objectContaining({
          error: expect.any(Error),
          requestedUserId: 'user-1'
        })
      );

      consoleSpy.mockRestore();
    });

    it('should preserve specific error messages', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Test that specific error messages are preserved
      mockUserRepository.findById.mockResolvedValueOnce(null);

      await expect(getUserByIdUseCase.execute({ id: 'user-1' }, adminAuthContext))
        .rejects.toThrow('User with id user-1 not found');

      consoleSpy.mockRestore();
    });

    it('should handle unknown errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate a non-Error object being thrown
      mockUserRepository.findById.mockRejectedValueOnce('String error');

      await expect(getUserByIdUseCase.execute({ id: 'user-1' }, adminAuthContext))
        .rejects.toThrow('Error retrieving user information');

      consoleSpy.mockRestore();
    });
  });
}); 