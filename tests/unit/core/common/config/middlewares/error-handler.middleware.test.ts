import { handleError, wrapHandler } from '../../../../../../core/common/config/middlewares/error-handler.middleware';
import { DomainError } from '../../../../../../core/common/domain/exceptions/domain.error';
import { ValidationError } from '../../../../../../core/common/domain/exceptions/validation.error';
import { EntityNotFoundError } from '../../../../../../core/common/domain/exceptions/entity-not-found.error';
import { UnauthorizedError } from '../../../../../../core/common/domain/exceptions/unauthorized.error';
import { InvalidCredentialsError, UserNotFoundError, AuthenticationFailedError } from '../../../../../../core/auth/domain/auth-errors';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Concrete implementation for testing
class TestDomainError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: Record<string, unknown>) {
    super(message, code, statusCode, details);
  }
}

// Mock Vercel types
const mockRequest = {} as VercelRequest;

describe('Error Handler Middleware', () => {
  let mockResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mock response for each test
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('handleError', () => {
    it('should handle DomainError correctly', () => {
      // Arrange
      const domainError = new TestDomainError('Test error', 'TEST_ERROR', 400);

      // Act
      handleError(domainError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'TestDomainError',
          message: 'Test error',
          code: 'TEST_ERROR',
          statusCode: 400,
          details: undefined
        }
      });
    });

    it('should handle ValidationError correctly', () => {
      // Arrange
      const validationError = new ValidationError('Validation failed', ['Field is required']);

      // Act
      handleError(validationError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'ValidationError',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400
        }
      });
    });

    it('should handle EntityNotFoundError correctly', () => {
      // Arrange
      const notFoundError = new EntityNotFoundError('User', '123');

      // Act
      handleError(notFoundError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'EntityNotFoundError',
          message: "User with identifier '123' not found",
          code: 'ENTITY_NOT_FOUND',
          statusCode: 404
        }
      });
    });

    it('should handle UnauthorizedError correctly', () => {
      // Arrange
      const unauthorizedError = new UnauthorizedError('Access denied');

      // Act
      handleError(unauthorizedError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'UnauthorizedError',
          message: 'Access denied',
          code: 'UNAUTHORIZED',
          statusCode: 401
        }
      });
    });

    it('should handle InvalidCredentialsError correctly', () => {
      // Arrange
      const invalidCredentialsError = new InvalidCredentialsError();

      // Act
      handleError(invalidCredentialsError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'InvalidCredentialsError',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          statusCode: 401
        }
      });
    });

    it('should handle UserNotFoundError correctly', () => {
      // Arrange
      const userNotFoundError = new UserNotFoundError('test@example.com');

      // Act
      handleError(userNotFoundError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'UserNotFoundError',
          message: 'User with email test@example.com not found',
          code: 'USER_NOT_FOUND',
          statusCode: 404
        }
      });
    });

    it('should handle AuthenticationFailedError correctly', () => {
      // Arrange
      const authFailedError = new AuthenticationFailedError();

      // Act
      handleError(authFailedError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'AuthenticationFailedError',
          message: 'Authentication failed',
          code: 'AUTHENTICATION_FAILED',
          statusCode: 401
        }
      });
    });

    it('should handle generic Error correctly', () => {
      // Arrange
      const genericError = new Error('Generic error');

      // Act
      handleError(genericError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'InternalServerError',
          message: 'An unexpected error occurred',
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500
        }
      });
    });

    it('should handle unknown error types', () => {
      // Arrange
      const unknownError = 'String error' as any;

      // Act
      handleError(unknownError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'InternalServerError',
          message: 'An unexpected error occurred',
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500
        }
      });
    });

    it('should handle DomainError with details', () => {
      // Arrange
      const details = { field: 'email', reason: 'invalid format' };
      const domainError = new TestDomainError('Test error', 'TEST_ERROR', 400, details);

      // Act
      handleError(domainError, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'TestDomainError',
          message: 'Test error',
          code: 'TEST_ERROR',
          statusCode: 400,
          details
        }
      });
    });
  });

  describe('wrapHandler', () => {
    it('should call handler successfully when no error occurs', async () => {
      // Arrange
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = wrapHandler(handler);

      // Act
      await wrappedHandler(mockRequest, mockResponse);

      // Assert
      expect(handler).toHaveBeenCalledWith(mockRequest, mockResponse, undefined);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call handler with context when provided', async () => {
      // Arrange
      const context = { userId: '123', role: 'admin' };
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = wrapHandler(handler);

      // Act
      await wrappedHandler(mockRequest, mockResponse, context);

      // Assert
      expect(handler).toHaveBeenCalledWith(mockRequest, mockResponse, context);
    });

    it('should handle errors thrown by handler', async () => {
      // Arrange
      const error = new TestDomainError('Handler error', 'HANDLER_ERROR', 400);
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = wrapHandler(handler);

      // Act
      await wrappedHandler(mockRequest, mockResponse);

      // Assert
      expect(handler).toHaveBeenCalledWith(mockRequest, mockResponse, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'TestDomainError',
          message: 'Handler error',
          code: 'HANDLER_ERROR',
          statusCode: 400,
          details: undefined
        }
      });
    });

    it('should handle async errors thrown by handler', async () => {
      // Arrange
      const error = new Error('Async error');
      const handler = jest.fn().mockImplementation(async () => {
        throw error;
      });
      const wrappedHandler = wrapHandler(handler);

      // Act
      await wrappedHandler(mockRequest, mockResponse);

      // Assert
      expect(handler).toHaveBeenCalledWith(mockRequest, mockResponse, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'InternalServerError',
          message: 'An unexpected error occurred',
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500
        }
      });
    });

    it('should handle synchronous errors thrown by handler', async () => {
      // Arrange
      const error = new Error('Sync error');
      const handler = jest.fn().mockImplementation(() => {
        throw error;
      });
      const wrappedHandler = wrapHandler(handler);

      // Act
      await wrappedHandler(mockRequest, mockResponse);

      // Assert
      expect(handler).toHaveBeenCalledWith(mockRequest, mockResponse, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'InternalServerError',
          message: 'An unexpected error occurred',
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500
        }
      });
    });

    it('should preserve error handling for specific error types', async () => {
      // Arrange
      const validationError = new ValidationError('Field validation failed');
      const handler = jest.fn().mockRejectedValue(validationError);
      const wrappedHandler = wrapHandler(handler);

      // Act
      await wrappedHandler(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: 'ValidationError',
          message: 'Field validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400
        }
      });
    });
  });

  describe('error response format', () => {
    it('should maintain consistent error response structure', () => {
      // Arrange
      const error = new TestDomainError('Test error', 'TEST_ERROR', 422, { field: 'test' });

      // Act
      handleError(error, mockRequest, mockResponse);

      // Assert
      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty('error');
      expect(responseCall.error).toHaveProperty('name');
      expect(responseCall.error).toHaveProperty('message');
      expect(responseCall.error).toHaveProperty('code');
      expect(responseCall.error).toHaveProperty('statusCode');
      expect(responseCall.error).toHaveProperty('details');
    });

    it('should handle null details gracefully', () => {
      // Arrange
      const error = new TestDomainError('Test error', 'TEST_ERROR', 400);

      // Act
      handleError(error, mockRequest, mockResponse);

      // Assert
      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall.error.details).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle error without statusCode', () => {
      // Arrange
      const error = new Error('Test error') as any;
      error.statusCode = undefined;

      // Act
      handleError(error, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle error with non-numeric statusCode', () => {
      // Arrange
      const error = new Error('Test error') as any;
      error.statusCode = 'invalid';

      // Act
      handleError(error, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle error with very large statusCode', () => {
      // Arrange
      const error = new Error('Test error') as any;
      error.statusCode = 999;

      // Act
      handleError(error, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
}); 