/**
 * LoginUseCase Application Tests
 * Comprehensive testing for user authentication with >90% coverage
 */

import { LoginUseCase } from '../../../../../core/user/application/login.usecase';
import type { UserRepositoryPrisma } from '../../../../../core/user/infrastructure/user.repository.prisma';
import { SupabaseService } from '../../../../../shared/auth/supabase.service';

// Mock dependencies
jest.mock('../../../../../shared/auth/supabase.service', () => ({
  SupabaseService: {
    signIn: jest.fn()
  }
}));

jest.mock('../../../../../core/user/infrastructure/user.repository.prisma');

describe('LoginUseCase Application Tests', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryPrisma>;
  let mockSupabaseService: jest.Mocked<typeof SupabaseService>;

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

    mockSupabaseService = SupabaseService as jest.Mocked<typeof SupabaseService>;

    loginUseCase = new LoginUseCase(mockUserRepository);
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

      const mockSupabaseUser = {
        id: 'user-123',
        email: 'john@example.com'
      };

      const mockSession = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'refresh-token-123',
        expires_at: 1640995200
      };

      const mockUser = createMockUser();

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSession
        },
        error: null
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await loginUseCase.execute(loginRequest);

      expect(mockSupabaseService.signIn).toHaveBeenCalledWith('john@example.com', 'securepassword123');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'john@example.com',
          name: 'John Doe',
          role: 'user'
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh-token-123',
        expiresAt: 1640995200
      });
    });

    it('should handle admin user authentication', async () => {
      const loginRequest = {
        email: 'admin@example.com',
        password: 'adminpass123'
      };

      const mockSupabaseUser = {
        id: 'admin-123',
        email: 'admin@example.com'
      };

      const mockSession = {
        access_token: 'admin-access-token',
        refresh_token: 'admin-refresh-token',
        expires_at: 1640995200
      };

      const mockAdminUser = createMockUser({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      });

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSession
        },
        error: null
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockAdminUser);

      const result = await loginUseCase.execute(loginRequest);

      expect(result.user.role).toBe('admin');
      expect(result.accessToken).toBe('admin-access-token');
    });

    it('should normalize email to lowercase', async () => {
      const loginRequest = {
        email: 'JOHN@EXAMPLE.COM',
        password: 'securepassword123'
      };

      const mockSupabaseUser = {
        id: 'user-123',
        email: 'john@example.com'
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1640995200
      };

      const mockUser = createMockUser();

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSession
        },
        error: null
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await loginUseCase.execute(loginRequest);

      expect(mockSupabaseService.signIn).toHaveBeenCalledWith('john@example.com', 'securepassword123');
    });

    it('should trim whitespace from email', async () => {
      const loginRequest = {
        email: '  john@example.com  ',
        password: 'securepassword123'
      };

      const mockSupabaseUser = {
        id: 'user-123',
        email: 'john@example.com'
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1640995200
      };

      const mockUser = createMockUser();

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSession
        },
        error: null
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await loginUseCase.execute(loginRequest);

      expect(mockSupabaseService.signIn).toHaveBeenCalledWith('john@example.com', 'securepassword123');
    });
  });

  describe('Authentication Failures', () => {
    it('should throw error for invalid credentials', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      mockSupabaseService.signIn.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error when Supabase returns error', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      mockSupabaseService.signIn.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error when user not found in database', async () => {
      const loginRequest = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const mockSupabaseUser = {
        id: 'user-123',
        email: 'nonexistent@example.com'
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1640995200
      };

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSession
        },
        error: null
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('User not found in database');
    });

    it('should throw error for duplicate email error from Supabase', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      mockSupabaseService.signIn.mockResolvedValue({
        data: null,
        error: { message: 'User already exists' }
      });

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase service errors', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      mockSupabaseService.signIn.mockRejectedValue(new Error('Supabase service unavailable'));

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('Authentication failed');
    });

    it('should handle database errors', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      const mockSupabaseUser = {
        id: 'user-123',
        email: 'john@example.com'
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1640995200
      };

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSession
        },
        error: null
      });

      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      await expect(loginUseCase.execute(loginRequest))
        .rejects.toThrow('Authentication failed');
    });

    it('should preserve specific error messages', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      mockSupabaseService.signIn.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      try {
        await loginUseCase.execute(loginRequest);
      } catch (error) {
        expect(error.message).toBe('Invalid credentials');
      }
    });

    it('should preserve user not found error message', async () => {
      const loginRequest = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const mockSupabaseUser = {
        id: 'user-123',
        email: 'nonexistent@example.com'
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1640995200
      };

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSession
        },
        error: null
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);

      try {
        await loginUseCase.execute(loginRequest);
      } catch (error) {
        expect(error.message).toBe('User not found in database');
      }
    });
  });

  describe('Data Transformation', () => {
    it('should transform user role to lowercase', async () => {
      const loginRequest = {
        email: 'admin@example.com',
        password: 'adminpass123'
      };

      const mockSupabaseUser = {
        id: 'admin-123',
        email: 'admin@example.com'
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1640995200
      };

      const mockAdminUser = createMockUser({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      });

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSession
        },
        error: null
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockAdminUser);

      const result = await loginUseCase.execute(loginRequest);

      expect(result.user.role).toBe('admin');
    });

    it('should return only safe user data', async () => {
      const loginRequest = {
        email: 'john@example.com',
        password: 'password123'
      };

      const mockSupabaseUser = {
        id: 'user-123',
        email: 'john@example.com'
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 1640995200
      };

      const mockUser = createMockUser();

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSession
        },
        error: null
      });

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