/**
 * CreateUserUseCase Application Tests
 * Comprehensive testing for CreateUser use case with >80% coverage
 */

import { CreateUserUseCase } from '../../../../../core/user/application/create-user.usecase';
import { UserAlreadyExistsError } from '../../../../../core/user/domain/user-errors';
import { UnauthorizedError } from '../../../../../core/common/domain/exceptions/unauthorized.error';
import type { UserRepositoryPort } from '../../../../../core/user/domain/ports/out/user-repository.port';
import type { AuthServicePort } from '../../../../../core/auth/domain/ports/out/auth-service.port';
import type { AuthContext } from '../../../../../core/common/config/middlewares/auth.middleware';
import { UserRole } from '../../../../../core/user/domain/entities/user.entity';

// Mocks
const mockUserRepository: jest.Mocked<UserRepositoryPort> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  findAllPaginated: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByIdMinimal: jest.fn(),
  validateUsersForAssignment: jest.fn()
};

const mockAuthService: jest.Mocked<AuthServicePort> = {
  createUser: jest.fn(),
  authenticateUser: jest.fn(),
  verifyToken: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  deleteUser: jest.fn()
};

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    createUserUseCase = new CreateUserUseCase(mockUserRepository, mockAuthService);
  });

  describe('execute', () => {
    const validRequest = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phoneNumber: '+1234567890',
      role: 'user' as const
    };

    const mockAuthUser = {
      id: 'auth-user-123',
      email: 'test@example.com',
      emailVerified: true
    };

    const mockCreatedUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashedPassword123',
      name: 'Test User',
      role: UserRole.USER,
      phoneNumber: '+1234567890',
      address: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    describe('Admin creating user', () => {
      const adminContext: AuthContext = {
        isAuthenticated: true,
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin'
        }
      };

      it('should successfully create a user when admin creates user', async () => {
        // Arrange
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockResolvedValue(mockCreatedUser);

        // Act
        const result = await createUserUseCase.execute(validRequest, adminContext);

        // Assert
        expect(mockAuthService.createUser).toHaveBeenCalledWith(
          validRequest.email,
          validRequest.password
        );
        expect(mockUserRepository.create).toHaveBeenCalledWith({
          id: mockAuthUser.id,
          name: validRequest.name,
          email: validRequest.email,
          phoneNumber: validRequest.phoneNumber,
          role: 'USER',
          address: undefined
        });
        expect(result).toEqual({
          id: mockCreatedUser.id,
          email: mockCreatedUser.email,
          name: mockCreatedUser.name,
          phoneNumber: mockCreatedUser.phoneNumber,
          role: mockCreatedUser.role.toLowerCase(),
          address: mockCreatedUser.address,
          createdAt: mockCreatedUser.createdAt,
          updatedAt: mockCreatedUser.updatedAt
        });
      });

      it('should successfully create an admin user when admin creates admin', async () => {
        // Arrange
        const adminRequest = { ...validRequest, role: 'admin' as const };
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockResolvedValue({ ...mockCreatedUser, role: UserRole.ADMIN });

        // Act
        const result = await createUserUseCase.execute(adminRequest, adminContext);

        // Assert
        expect(mockUserRepository.create).toHaveBeenCalledWith({
          id: mockAuthUser.id,
          name: adminRequest.name,
          email: adminRequest.email,
          phoneNumber: adminRequest.phoneNumber,
          role: 'ADMIN',
          address: undefined
        });
        expect(result.role).toBe('admin');
      });

      it('should handle case-insensitive role input', async () => {
        // Arrange
        const requestWithUpperCaseRole = { ...validRequest, role: 'ADMIN' as any };
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockResolvedValue({ ...mockCreatedUser, role: UserRole.ADMIN });

        // Act
        const result = await createUserUseCase.execute(requestWithUpperCaseRole, adminContext);

        // Assert
        expect(result.role).toBe('admin');
      });
    });

    describe('Anonymous user registration', () => {
      const anonymousContext: AuthContext = {
        isAuthenticated: false
      };

      it('should successfully create a user when anonymous user registers', async () => {
        // Arrange
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockResolvedValue(mockCreatedUser);

        // Act
        const result = await createUserUseCase.execute(validRequest, anonymousContext);

        // Assert
        expect(mockUserRepository.create).toHaveBeenCalledWith({
          id: mockAuthUser.id,
          name: validRequest.name,
          email: validRequest.email,
          phoneNumber: validRequest.phoneNumber,
          role: 'USER',
          address: undefined
        });
        expect(result.role).toBe('user');
      });

      it('should throw UnauthorizedError when anonymous user tries to create admin', async () => {
        // Arrange
        const adminRequest = { ...validRequest, role: 'admin' as const };

        // Act & Assert
        await expect(createUserUseCase.execute(adminRequest, anonymousContext))
          .rejects.toThrow(UnauthorizedError);
        expect(mockAuthService.createUser).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedError when anonymous user tries to create admin with uppercase', async () => {
        // Arrange
        const adminRequest = { ...validRequest, role: 'ADMIN' as any };

        // Act & Assert
        await expect(createUserUseCase.execute(adminRequest, anonymousContext))
          .rejects.toThrow(UnauthorizedError);
      });
    });

    describe('Regular user attempting to create user', () => {
      const userContext: AuthContext = {
        isAuthenticated: true,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'user'
        }
      };

      it('should throw UnauthorizedError when regular user tries to create another user', async () => {
        // Act & Assert
        await expect(createUserUseCase.execute(validRequest, userContext))
          .rejects.toThrow(UnauthorizedError);
        expect(mockAuthService.createUser).not.toHaveBeenCalled();
      });
    });

    describe('Error handling', () => {
      const adminContext: AuthContext = {
        isAuthenticated: true,
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin'
        }
      };

      it('should throw UserAlreadyExistsError when auth service returns null', async () => {
        // Arrange
        mockAuthService.createUser.mockResolvedValue(null);

        // Act & Assert
        await expect(createUserUseCase.execute(validRequest, adminContext))
          .rejects.toThrow(UserAlreadyExistsError);
        expect(mockUserRepository.create).not.toHaveBeenCalled();
      });

      it('should throw error when database creation fails', async () => {
        // Arrange
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(createUserUseCase.execute(validRequest, adminContext))
          .rejects.toThrow('Error creating user in database');
      });

      it('should throw error when auth service fails', async () => {
        // Arrange
        mockAuthService.createUser.mockRejectedValue(new Error('Auth service error'));

        // Act & Assert
        await expect(createUserUseCase.execute(validRequest, adminContext))
          .rejects.toThrow('Auth service error');
      });
    });

    describe('Data normalization', () => {
      const adminContext: AuthContext = {
        isAuthenticated: true,
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin'
        }
      };

      it('should normalize email to lowercase', async () => {
        // Arrange
        const requestWithUpperCaseEmail = { ...validRequest, email: 'TEST@EXAMPLE.COM' };
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockResolvedValue(mockCreatedUser);

        // Act
        await createUserUseCase.execute(requestWithUpperCaseEmail, adminContext);

        // Assert
        expect(mockAuthService.createUser).toHaveBeenCalledWith(
          'test@example.com',
          validRequest.password
        );
      });

      it('should normalize role to lowercase', async () => {
        // Arrange
        const requestWithUpperCaseRole = { ...validRequest, role: 'ADMIN' as any };
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockResolvedValue({ ...mockCreatedUser, role: UserRole.ADMIN });

        // Act
        await createUserUseCase.execute(requestWithUpperCaseRole, adminContext);

        // Assert
        expect(mockUserRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'ADMIN'
          })
        );
      });

      it('should trim whitespace from text fields', async () => {
        // Arrange
        const requestWithWhitespace = {
          ...validRequest,
          name: '  Test User  ',
          phoneNumber: '  +1234567890  '
        };
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockResolvedValue(mockCreatedUser);

        // Act
        await createUserUseCase.execute(requestWithWhitespace, adminContext);

        // Assert
        expect(mockUserRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test User',
            phoneNumber: '+1234567890'
          })
        );
      });
    });

    describe('Address handling', () => {
      const adminContext: AuthContext = {
        isAuthenticated: true,
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin'
        }
      };

      it('should handle user creation with address', async () => {
        // Arrange
        const requestWithAddress = {
          ...validRequest,
          address: {
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4B',
            city: 'New York',
            stateOrProvince: 'NY',
            postalCode: '10001',
            country: 'USA'
          }
        };
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockResolvedValue({
          ...mockCreatedUser,
          address: requestWithAddress.address
        });

        // Act
        const result = await createUserUseCase.execute(requestWithAddress, adminContext);

        // Assert
        expect(mockUserRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            address: requestWithAddress.address
          })
        );
        expect(result.address).toEqual(requestWithAddress.address);
      });

      it('should normalize address fields', async () => {
        // Arrange
        const requestWithAddress = {
          ...validRequest,
          address: {
            addressLine1: '  123 Main St  ',
            addressLine2: '  Apt 4B  ',
            city: '  New York  ',
            stateOrProvince: '  NY  ',
            postalCode: '  10001  ',
            country: '  USA  '
          }
        };
        mockAuthService.createUser.mockResolvedValue(mockAuthUser);
        mockUserRepository.create.mockResolvedValue(mockCreatedUser);

        // Act
        await createUserUseCase.execute(requestWithAddress, adminContext);

        // Assert
        expect(mockUserRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            address: {
              addressLine1: '123 Main St',
              addressLine2: 'Apt 4B',
              city: 'New York',
              stateOrProvince: 'NY',
              postalCode: '10001',
              country: 'USA'
            }
          })
        );
      });
    });
  });
}); 