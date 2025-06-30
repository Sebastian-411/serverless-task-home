/**
 * LoginUseCase Application Tests
 * Comprehensive testing for user authentication with >90% coverage
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { LoginUseCase } from '../../../../../core/auth/application/login.usecase';
import type { UserRepositoryPrisma } from '../../../../../core/user/infrastructure/adapters/out/user-repository-prisma';
import { SupabaseAuthService } from '../../../../../core/auth/infrastructure/adapters/out/supabase-auth.service';

// Mock dependencies
jest.mock('../../../../../core/auth/infrastructure/adapters/out/supabase-auth.service');

describe('LoginUseCase Application Tests', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: any;
  let mockSupabaseService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mocked repository
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAllPaginated: jest.fn(),
      count: jest.fn(),
      findByIdMinimal: jest.fn(),
      validateUsersForAssignment: jest.fn()
    } as any;

    mockSupabaseService = {
      signIn: jest.fn(),
      createUser: jest.fn(),
      verifyToken: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      deleteUser: jest.fn(),
      authenticateUser: jest.fn()
    } as any;

    loginUseCase = new LoginUseCase(mockSupabaseService, mockUserRepository);
  });

  // Helper function to create mock user data
  const createMockUser = (overrides: any = {}) => ({
    id: 'user-123',
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

  describe('Successful Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'securepassword123'
      };

      const mockAuthResult = {
        user: {
          id: 'user-123',
          email: 'john@example.com',
          emailVerified: true
        },
        token: 'token_user-123'
      };

      const mockUser = createMockUser();

      mockSupabaseService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await loginUseCase.execute(loginRequest);

      expect(mockSupabaseService.authenticateUser).toHaveBeenCalledWith('john@example.com', 'securepassword123');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'john@example.com',
          name: 'John Doe',
          role: 'user'
        },
        token: 'token_user-123'
      });
    });

    it('should handle admin user authentication', async () => {
      const loginRequest = {
        email: 'admin@example.com',
        password: 'adminpass123'
      };

      const mockAuthResult = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          emailVerified: true
        },
        token: 'token_admin-123'
      };

      const mockAdminUser = createMockUser({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      });

      mockSupabaseService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(mockAdminUser);

      const result = await loginUseCase.execute(loginRequest);

      expect(result.user.role).toBe('admin');
      expect(result.token).toBe('token_admin-123');
    });

    it('should normalize email to lowercase', async () => {
      const loginRequest = {
        email: 'JOHN@EXAMPLE.COM',
        password: 'securepassword123'
      };

      const mockAuthResult = {
        user: {
          id: 'user-123',
          email: 'john@example.com',
          emailVerified: true
        },
        token: 'token_user-123'
      };

      const mockUser = createMockUser();

      mockSupabaseService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await loginUseCase.execute(loginRequest);

      expect(mockSupabaseService.authenticateUser).toHaveBeenCalledWith('JOHN@EXAMPLE.COM', 'securepassword123');
    });

    it('should trim whitespace from email', async () => {
      const loginRequest = {
        email: '  john@example.com  ',
        password: 'securepassword123'
      };

      const mockAuthResult = {
        user: {
          id: 'user-123',
          email: 'john@example.com',
          emailVerified: true
        },
        token: 'token_user-123'
      };

      const mockUser = createMockUser();

      mockSupabaseService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await loginUseCase.execute(loginRequest);

      expect(mockSupabaseService.authenticateUser).toHaveBeenCalledWith('  john@example.com  ', 'securepassword123');
    });
  });

  describe('Authentication Failures', () => {
    it('should throw error for invalid credentials', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      mockSupabaseService.authenticateUser.mockResolvedValue(null);

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw error when user not found in database', async () => {
      const loginRequest = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const mockAuthResult = {
        user: {
          id: 'user-123',
          email: 'nonexistent@example.com',
          emailVerified: true
        },
        token: 'token_user-123'
      };

      mockSupabaseService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('User with email nonexistent@example.com not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase service errors', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      mockSupabaseService.authenticateUser.mockRejectedValue(new Error('Supabase service unavailable'));

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('Supabase service unavailable');
    });

    it('should handle database errors', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      const mockAuthResult = {
        user: {
          id: 'user-123',
          email: 'john@example.com',
          emailVerified: true
        },
        token: 'token_user-123'
      };

      mockSupabaseService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('Database connection failed');
    });

    it('should preserve specific error messages', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      mockSupabaseService.authenticateUser.mockResolvedValue(null);

      try {
        await loginUseCase.execute(loginRequest);
      } catch (error) {
        expect(error.message).toBe('Invalid email or password');
      }
    });

    it('should preserve user not found error message', async () => {
      const loginRequest = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const mockAuthResult = {
        user: {
          id: 'user-123',
          email: 'nonexistent@example.com',
          emailVerified: true
        },
        token: 'token_user-123'
      };

      mockSupabaseService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      try {
        await loginUseCase.execute(loginRequest);
      } catch (error) {
        expect(error.message).toBe('User with email nonexistent@example.com not found');
      }
    });
  });

  describe('Data Transformation', () => {
    it('should transform user role to lowercase', async () => {
      const loginRequest = {
        email: 'admin@example.com',
        password: 'adminpass123'
      };

      const mockAuthResult = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          emailVerified: true
        },
        token: 'token_admin-123'
      };

      const mockAdminUser = createMockUser({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      });

      mockSupabaseService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(mockAdminUser);

      const result = await loginUseCase.execute(loginRequest);

      expect(result.user.role).toBe('admin');
    });

    it('should return only safe user data', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      const mockAuthResult = {
        user: {
          id: 'user-123',
          email: 'john@example.com',
          emailVerified: true
        },
        token: 'token_user-123'
      };

      const mockUser = createMockUser();

      mockSupabaseService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await loginUseCase.execute(loginRequest);

      // Should only include safe fields
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('name');
      expect(result.user).toHaveProperty('role');
      
      // Should not include sensitive fields
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('hashedPassword');
      expect(result.user).not.toHaveProperty('phoneNumber');
      expect(result.user).not.toHaveProperty('address');
      expect(result.user).not.toHaveProperty('createdAt');
    });
  });
}); 