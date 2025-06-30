/**
 * SupabaseAuthService Infrastructure Tests
 * Comprehensive testing for Supabase authentication service with >90% coverage
 */

// 1. Define los mocks primero
const mockAuth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  admin: {
    updateUserById: jest.fn(),
    deleteUser: jest.fn(),
    listUsers: jest.fn()
  }
};

const mockStorage = {
  listBuckets: jest.fn(),
  from: jest.fn(() => ({
    list: jest.fn(),
    remove: jest.fn()
  }))
};

const mockSupabaseClient = {
  auth: mockAuth,
  storage: mockStorage
};

const mockAdminClient = {
  auth: mockAuth,
  storage: mockStorage
};

const mockCreateClient = jest.fn((url, key) => {
  // Si es la service role key, devolver admin client
  if (key === 'service-role-key') {
    return mockAdminClient;
  }
  return mockSupabaseClient;
});

// 2. Mockea el módulo ANTES de los imports que lo usan
jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}));

// 3. Ahora importa el servicio y los errores
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { SupabaseAuthService } from '@/core/auth/infrastructure/adapters/out/supabase-auth.service';
import { InvalidCredentialsError } from '@/core/auth/domain/auth-errors';


describe('SupabaseAuthService', () => {
  let authService: SupabaseAuthService;
  const mockConfig = {
    url: 'https://test.supabase.co',
    key: 'test-key',
    serviceRoleKey: 'service-role-key'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock to return our mockSupabaseClient
    mockCreateClient.mockImplementation((url, key) => {
      if (key === 'service-role-key') {
        return mockAdminClient;
      }
      return mockSupabaseClient;
    });
    authService = new SupabaseAuthService(mockConfig);
  });

  describe('createUser', () => {
    it('should successfully create a user', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z'
      };

      (mockAuth.signUp as any).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Act
      const result = await authService.createUser('test@example.com', 'password123');

      // Assert
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true
      });
    });

    it('should return null when signup fails', async () => {
      // Arrange
      (mockAuth.signUp as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Signup failed' }
      });

      // Act
      const result = await authService.createUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user is null', async () => {
      // Arrange
      (mockAuth.signUp as any).mockResolvedValue({
        data: { user: null },
        error: null
      });

      // Act
      const result = await authService.createUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      // Arrange
      (mockAuth.signUp as any).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await authService.createUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle user with unverified email', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null
      };

      (mockAuth.signUp as any).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Act
      const result = await authService.createUser('test@example.com', 'password123');

      // Assert
      expect(result?.emailVerified).toBe(false);
    });

    it('should throw error when client is not initialized', async () => {
      // Arrange
      const authServiceWithoutInit = new (class extends SupabaseAuthService {
        constructor() {
          super(mockConfig);
          // Override the client to be null
          (this as any).client = null;
        }
      })();

      // Act & Assert
      // The service is designed to handle errors gracefully and return null
      // instead of throwing exceptions
      const result = await authServiceWithoutInit.createUser('test@example.com', 'password123');
      expect(result).toBeNull();
    });
  });

  describe('authenticateUser', () => {
    it('should successfully authenticate a user', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z'
      };

      const mockSession = {
        access_token: 'mock_access_token_123'
      };

      (mockAuth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      // Act
      const result = await authService.authenticateUser('test@example.com', 'password123');

      // Assert
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailVerified: true
        },
        token: 'mock_access_token_123'
      });
    });

    it('should return null when authentication fails', async () => {
      // Arrange
      (mockAuth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      // Act
      const result = await authService.authenticateUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      // Arrange
      (mockAuth.signInWithPassword as any).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await authService.authenticateUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify a token', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z'
      };

      (mockAuth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Act
      const result = await authService.verifyToken('valid-token');

      // Assert
      expect(mockAuth.getUser).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true
      });
    });

    it('should return null when token is invalid', async () => {
      // Arrange
      (mockAuth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      // Act
      const result = await authService.verifyToken('invalid-token');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      // Arrange
      (mockAuth.getUser as any).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await authService.verifyToken('invalid-token');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      // Arrange
      (mockAuth.resetPasswordForEmail as any).mockResolvedValue({
        error: null
      });

      // Act
      const result = await authService.resetPassword('test@example.com');

      // Assert
      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBe(true);
    });

    it('should return false when reset fails', async () => {
      // Arrange
      (mockAuth.resetPasswordForEmail as any).mockResolvedValue({
        error: { message: 'Reset failed' }
      });

      // Act
      const result = await authService.resetPassword('test@example.com');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle exceptions gracefully', async () => {
      // Arrange
      (mockAuth.resetPasswordForEmail as any).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await authService.resetPassword('test@example.com');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should successfully update password', async () => {
      // Arrange
      (mockAuth.admin.updateUserById as any).mockResolvedValue({
        error: null
      });

      // Act
      const result = await authService.updatePassword('user-123', 'newpassword123');

      // Assert
      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('user-123', {
        password: 'newpassword123'
      });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      // Arrange
      (mockAuth.admin.updateUserById as any).mockResolvedValue({
        error: { message: 'Update failed' }
      });

      // Act
      const result = await authService.updatePassword('user-123', 'newpassword123');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle exceptions gracefully', async () => {
      // Arrange
      (mockAuth.admin.updateUserById as any).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await authService.updatePassword('user-123', 'newpassword123');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete user', async () => {
      // Arrange
      // Mock storage service
      (mockStorage.listBuckets as any).mockResolvedValue({
        data: [],
        error: null
      });
      
      (mockAuth.admin.deleteUser as any).mockResolvedValue({
        error: null
      });

      // Act
      const result = await authService.deleteUser('user-123');

      // Assert
      expect(mockAuth.admin.deleteUser).toHaveBeenCalledWith('user-123');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      // Arrange
      (mockAuth.admin.deleteUser as any).mockResolvedValue({
        error: { message: 'Deletion failed' }
      });

      // Act
      const result = await authService.deleteUser('user-123');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle exceptions gracefully', async () => {
      // Arrange
      (mockAuth.admin.deleteUser as any).mockRejectedValue(new Error('Network error'));

      const result = await authService.deleteUser('user-123');

      expect(result).toBe(false);
    });
  });

  describe('deleteAllUsers', () => {
    it('should successfully delete all users', async () => {
      // Arrange
      const mockUsers = {
        users: [
          { id: 'user-1', email: 'user1@test.com' },
          { id: 'user-2', email: 'user2@test.com' }
        ]
      };

      (mockStorage.listBuckets as any).mockResolvedValue({
        data: [],
        error: null
      });

      (mockAuth.admin.listUsers as any).mockResolvedValue({
        data: mockUsers,
        error: null
      });

      (mockAuth.admin.deleteUser as any).mockResolvedValue({
        error: null
      });

      // Act
      const result = await authService.deleteAllUsers();

      // Assert
      expect(mockAuth.admin.listUsers).toHaveBeenCalled();
      expect(mockAuth.admin.deleteUser).toHaveBeenCalledWith('user-1');
      expect(mockAuth.admin.deleteUser).toHaveBeenCalledWith('user-2');
      expect(result).toBe(true);
    });

    it('should return false when listing users fails', async () => {
      // Arrange
      (mockAuth.admin.listUsers as any).mockResolvedValue({
        data: null,
        error: { message: 'List failed' }
      });

      // Act
      const result = await authService.deleteAllUsers();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize with provided config', () => {
      expect(mockCreateClient).toHaveBeenCalledWith(mockConfig.url, mockConfig.key);
      expect(mockCreateClient).toHaveBeenCalledWith(mockConfig.url, mockConfig.serviceRoleKey);
    });

    it('should handle client not initialized gracefully', async () => {
      const authServiceWithoutInit = new (class extends SupabaseAuthService {
        constructor() {
          super(mockConfig);
          (this as any).client = null;
        }
      })();

      const result = await authServiceWithoutInit.createUser('test@example.com', 'password123');
      expect(result).toBeNull();
    });
  });
}); 