/**
 * GetUsersUseCase Application Tests
 * Comprehensive testing for users list retrieval with >80% coverage
 */

import { GetUsersUseCase, AuthContext, GetUsersResponse } from '../../../../../core/user/application/get-users.usecase';

describe('GetUsersUseCase Application Tests', () => {
  let getUsersUseCase: GetUsersUseCase;
  let mockUserRepository: any;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    
    getUsersUseCase = new GetUsersUseCase(mockUserRepository);
    
    // Reset all mocks
    jest.clearAllMocks();
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
      mockUserRepository.findAll.mockResolvedValueOnce(mockUsers);

      const result = await getUsersUseCase.execute(adminAuthContext);

      expect(mockUserRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockUsers[0].id,
        email: mockUsers[0].email,
        name: mockUsers[0].name,
        phoneNumber: mockUsers[0].phoneNumber,
        role: 'user', // Converted to lowercase
        address: mockUsers[0].address,
        createdAt: mockUsers[0].createdAt
      });
      expect(result[1]).toEqual({
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
      mockUserRepository.findAll.mockResolvedValueOnce([]);

      const result = await getUsersUseCase.execute(adminAuthContext);

      expect(mockUserRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should properly transform user roles from uppercase to lowercase', async () => {
      const usersWithMixedRoles = [
        { ...mockUsers[0], role: 'USER' },
        { ...mockUsers[1], role: 'ADMIN' }
      ];
      mockUserRepository.findAll.mockResolvedValueOnce(usersWithMixedRoles);

      const result = await getUsersUseCase.execute(adminAuthContext);

      expect(result[0].role).toBe('user');
      expect(result[1].role).toBe('admin');
    });

    it('should handle users without addresses correctly', async () => {
      const usersWithoutAddress = mockUsers.map(user => ({ ...user, address: null }));
      mockUserRepository.findAll.mockResolvedValueOnce(usersWithoutAddress);

      const result = await getUsersUseCase.execute(adminAuthContext);

      result.forEach(user => {
        expect(user.address).toBeUndefined();
      });
    });
  });

  describe('Authorization Validation', () => {
    it('should prevent regular user from accessing users list', async () => {
      await expect(getUsersUseCase.execute(userAuthContext))
        .rejects.toThrow('Only administrators can access the users list');

      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    });

    it('should prevent unauthenticated user from accessing users list', async () => {
      await expect(getUsersUseCase.execute(unauthenticatedContext))
        .rejects.toThrow('Only administrators can access the users list');

      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    });

    it('should prevent authenticated user without user context from accessing users list', async () => {
      const contextWithoutUser: AuthContext = {
        isAuthenticated: true
      };

      await expect(getUsersUseCase.execute(contextWithoutUser))
        .rejects.toThrow('Only administrators can access the users list');

      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
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

      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockUserRepository.findAll.mockRejectedValueOnce(new Error('Database connection failed'));

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
      mockUserRepository.findAll.mockRejectedValueOnce('String error');

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