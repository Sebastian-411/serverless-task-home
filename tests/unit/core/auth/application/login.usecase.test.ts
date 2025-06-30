import { LoginUseCase } from '../../../../../core/auth/application/login.usecase';
import { InvalidCredentialsError, UserNotFoundError } from '../../../../../core/auth/domain/auth-errors';
import type { AuthServicePort } from '../../../../../core/auth/domain/ports/out/auth-service.port';
import type { UserRepositoryPort } from '../../../../../core/user/domain/ports/out/user-repository.port';
import { UserRole } from '../../../../../core/user/domain/entities/user.entity';

// Mocks
const mockAuthService: jest.Mocked<AuthServicePort> = {
  createUser: jest.fn(),
  authenticateUser: jest.fn(),
  verifyToken: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  deleteUser: jest.fn()
};

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

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    loginUseCase = new LoginUseCase(mockAuthService, mockUserRepository);
  });

  describe('execute', () => {
    const validRequest = {
      email: 'test@example.com',
      password: 'Password123'
    };

    const mockAuthResult = {
      user: {
        id: 'auth-user-123',
        email: 'test@example.com',
        emailVerified: true
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
    };

    const mockUser = {
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

    it('should successfully authenticate and return user data with token', async () => {
      // Arrange
      mockAuthService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await loginUseCase.execute(validRequest);

      // Assert
      expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(
        validRequest.email,
        validRequest.password
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role.toLowerCase()
        },
        token: mockAuthResult.token // Real JWT token from Supabase!
      });
    });

    it('should throw InvalidCredentialsError when auth service returns null', async () => {
      // Arrange
      mockAuthService.authenticateUser.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUseCase.execute(validRequest)).rejects.toThrow(InvalidCredentialsError);
      expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(
        validRequest.email,
        validRequest.password
      );
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundError when user not found in repository', async () => {
      // Arrange
      mockAuthService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUseCase.execute(validRequest)).rejects.toThrow(
        new UserNotFoundError(validRequest.email)
      );
      expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(
        validRequest.email,
        validRequest.password
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
    });

    it('should handle admin role correctly', async () => {
      // Arrange
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      mockAuthService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(adminUser);

      // Act
      const result = await loginUseCase.execute(validRequest);

      // Assert
      expect(result.user.role).toBe('admin');
    });

    it('should handle auth service errors gracefully', async () => {
      // Arrange
      mockAuthService.authenticateUser.mockRejectedValue(new Error('Auth service error'));

      // Act & Assert
      await expect(loginUseCase.execute(validRequest)).rejects.toThrow('Auth service error');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockAuthService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Repository error'));

      // Act & Assert
      await expect(loginUseCase.execute(validRequest)).rejects.toThrow('Repository error');
    });

    it('should handle user with missing name gracefully', async () => {
      // Arrange
      const userWithoutName = { ...mockUser, name: '' };
      mockAuthService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(userWithoutName);

      // Act
      const result = await loginUseCase.execute(validRequest);

      // Assert
      expect(result.user.name).toBe('');
    });

    it('should handle user with null name gracefully', async () => {
      // Arrange
      const userWithNullName = { ...mockUser, name: null as any };
      mockAuthService.authenticateUser.mockResolvedValue(mockAuthResult);
      mockUserRepository.findByEmail.mockResolvedValue(userWithNullName);

      // Act
      const result = await loginUseCase.execute(validRequest);

      // Assert
      expect(result.user.name).toBe(null);
    });
  });


}); 