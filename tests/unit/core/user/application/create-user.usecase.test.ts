/**
 * CreateUserUseCase Application Tests
 * Comprehensive testing for CreateUser use case with >80% coverage
 */

import type { CreateUserRequest, AuthContext } from '../../../../../core/user/application/create-user.usecase';
import { CreateUserUseCase } from '../../../../../core/user/application/create-user.usecase';
import { createMockUserRepository } from '../../../mocks/repositories/user.repository.mock';
import { createMockSupabaseService } from '../../../mocks/services/supabase.mock';
import { UserRepository } from '../../../../../core/user/domain/user.repository';
import { User } from '../../../../../core/user/domain/user.entity';
import { Email } from '../../../../../shared/domain/value-objects/email.vo';
import { Name } from '../../../../../shared/domain/value-objects/name.vo';
import { Password } from '../../../../../shared/domain/value-objects/password.vo';
import { Address } from '../../../../../core/user/domain/address.entity';

// Mock the SupabaseService module
jest.mock('../../../../../shared/auth/supabase.service', () => ({
  SupabaseService: {
    createUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    verifyToken: jest.fn(),
    refreshSession: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn()
  }
}));

const { SupabaseService } = require('../../../../../shared/auth/supabase.service');

describe('CreateUserUseCase Application Tests', () => {
  let createUserUseCase: CreateUserUseCase;
  let mockUserRepository: any;


  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    createUserUseCase = new CreateUserUseCase(mockUserRepository);
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set default successful mock responses
    SupabaseService.createUser.mockResolvedValue({
      user: { id: 'supabase-user-1', email: 'test@example.com' },
      error: null
    });
  });

  const validCreateUserRequest: CreateUserRequest = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
    phoneNumber: '+1234567890',
    address: {
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      stateOrProvince: 'NY',
      postalCode: '10001',
      country: 'USA'
    },
    role: 'user' as const
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

  const anonymousAuthContext: AuthContext = {
    isAuthenticated: false
  };

  describe('Admin User Creation Scenarios', () => {
    it('should allow admin to create a regular user', async () => {
      const request = { ...validCreateUserRequest, role: 'user' as const };
      
      const expectedCreatedUser = {
        id: 'supabase-user-1',
        name: request.name,
        email: request.email,
        phoneNumber: request.phoneNumber,
        role: 'USER',
        address: request.address,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.create.mockResolvedValueOnce(expectedCreatedUser);

      const result = await createUserUseCase.execute(request, adminAuthContext);

      expect(SupabaseService.createUser).toHaveBeenCalledWith(
        request.email,
        request.password
      );

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        id: 'supabase-user-1',
        name: request.name,
        email: request.email,
        phoneNumber: request.phoneNumber,
        role: 'USER',
        address: request.address
      });

      expect(result).toEqual({
        id: expectedCreatedUser.id,
        email: expectedCreatedUser.email,
        name: expectedCreatedUser.name,
        phoneNumber: expectedCreatedUser.phoneNumber,
        role: 'user', // Returned in lowercase
        address: expectedCreatedUser.address,
        createdAt: expectedCreatedUser.createdAt
      });
    });

    it('should allow admin to create an admin user', async () => {
      const request = { ...validCreateUserRequest, role: 'admin' as const };
      
      const expectedCreatedUser = {
        id: 'supabase-user-1',
        name: request.name,
        email: request.email,
        phoneNumber: request.phoneNumber,
        role: 'ADMIN',
        address: request.address,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.create.mockResolvedValueOnce(expectedCreatedUser);

      const result = await createUserUseCase.execute(request, adminAuthContext);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'ADMIN'
        })
      );

      expect(result.role).toBe('admin'); // Returned in lowercase
    });
  });

  describe('Self-Registration Scenarios', () => {
    it('should allow anonymous user to self-register as regular user', async () => {
      const request = { ...validCreateUserRequest, role: 'user' as const };
      
      const expectedCreatedUser = {
        id: 'supabase-user-1',
        name: request.name,
        email: request.email,
        phoneNumber: request.phoneNumber,
        role: 'USER',
        address: request.address,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.create.mockResolvedValueOnce(expectedCreatedUser);

      const result = await createUserUseCase.execute(request, anonymousAuthContext);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'USER'
        })
      );

      expect(result.role).toBe('user');
    });

    it('should prevent anonymous user from creating admin user', async () => {
      const request = { ...validCreateUserRequest, role: 'admin' as const };

      await expect(createUserUseCase.execute(request, anonymousAuthContext))
        .rejects.toThrow('Anonymous users can only register as regular users');

      expect(SupabaseService.createUser).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('Authorization Validation', () => {
    it('should prevent regular user from creating other users', async () => {
      await expect(createUserUseCase.execute(validCreateUserRequest, userAuthContext))
        .rejects.toThrow('Regular users cannot create other users');

      expect(SupabaseService.createUser).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase user creation errors', async () => {
      SupabaseService.createUser.mockResolvedValueOnce({
        user: null,
        error: { message: 'Email already exists in Supabase' }
      });

      await expect(createUserUseCase.execute(validCreateUserRequest, adminAuthContext))
        .rejects.toThrow('User with this email already exists');

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database creation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockUserRepository.create.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(createUserUseCase.execute(validCreateUserRequest, adminAuthContext))
        .rejects.toThrow('Error creating user in database');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Database error, user created in Supabase but not in DB:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
}); 