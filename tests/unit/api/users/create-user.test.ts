/**
 * POST /users API Tests
 * Comprehensive testing for user creation endpoint with >90% coverage
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

import handler from '../../../../api/users/index';

// Mock dependencies
jest.mock('../../../../shared/config/dependencies', () => ({
  Dependencies: {
    createAuthenticatedEndpoint: jest.fn(),
    createUserUseCase: {
      execute: jest.fn()
    },
    authMiddleware: {
      authenticate: jest.fn()
    }
  }
}));

jest.mock('../../../../shared/middlewares/validation.middleware', () => ({
  ValidationMiddleware: {
    validate: jest.fn()
  }
}));

jest.mock('../../../../shared/middlewares/error-handler.middleware', () => ({
  ErrorHandler: {
    handle: jest.fn()
  }
}));

describe('POST /users API Tests', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockCreateUserUseCase: jest.Mock;
  let mockAuthMiddleware: jest.Mock;
  let mockValidationMiddleware: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };

    // Mock dependencies
    mockCreateUserUseCase = jest.fn();
    mockAuthMiddleware = jest.fn();
    mockValidationMiddleware = jest.fn();
    
    const { Dependencies } = require('../../../../shared/config/dependencies');
    const { ValidationMiddleware } = require('../../../../shared/middlewares/validation.middleware');
    
    Dependencies.createUserUseCase.execute = mockCreateUserUseCase;
    Dependencies.authMiddleware.authenticate = mockAuthMiddleware;
    ValidationMiddleware.validate = mockValidationMiddleware;
  });

  describe('Success Cases', () => {
    it('should create user with all required fields and return 201', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword123',
        phoneNumber: '+1234567890',
        role: 'user'
      };

      const createdUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        role: 'user',
        createdAt: new Date('2024-01-01')
      };

      mockReq.body = userData;
      mockValidationMiddleware.mockReturnValue({
        success: true,
        data: userData
      });
      mockAuthMiddleware.mockResolvedValue({
        success: false,
        authContext: null
      });
      mockCreateUserUseCase.mockResolvedValue(createdUser);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdUser,
        message: 'User created successfully'
      });
    });

    it('should create user with minimal required fields', async () => {
      const userData = {
        name: 'Minimal User',
        email: 'minimal@example.com',
        password: 'password123',
        phoneNumber: '+1234567890'
      };

      const createdUser = {
        id: 'user-456',
        name: 'Minimal User',
        email: 'minimal@example.com',
        phoneNumber: '+1234567890',
        role: 'user',
        createdAt: new Date('2024-01-01')
      };

      mockReq.body = userData;
      mockValidationMiddleware.mockReturnValue({
        success: true,
        data: userData
      });
      mockAuthMiddleware.mockResolvedValue({
        success: false,
        authContext: null
      });
      mockCreateUserUseCase.mockResolvedValue(createdUser);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdUser,
        message: 'User created successfully'
      });
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '+1234567890'
      };

      mockReq.body = userData;
      mockValidationMiddleware.mockReturnValue({
        success: false,
        response: {
          status: 400,
          body: {
            error: 'Validation error',
            message: 'Name is required'
          }
        }
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Name is required'
      });
    });

    it('should return 400 for missing email', async () => {
      const userData = {
        name: 'Test User',
        password: 'password123',
        phoneNumber: '+1234567890'
      };

      mockReq.body = userData;
      mockValidationMiddleware.mockReturnValue({
        success: false,
        response: {
          status: 400,
          body: {
            error: 'Validation error',
            message: 'Email is required'
          }
        }
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid user data', async () => {
      const mockRequest = {
        method: 'POST',
        body: { email: 'invalid-email', password: 'weak' },
        headers: {}
      } as VercelRequest;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as VercelResponse;

      await handler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error'
        })
      );
    });
  });

  describe('Method Validation', () => {
    it('should reject non-POST methods', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
        message: 'Only GET and POST methods are allowed'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle use case errors gracefully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '+1234567890'
      };

      mockReq.body = userData;
      mockValidationMiddleware.mockReturnValue({
        success: true,
        data: userData
      });
      mockAuthMiddleware.mockResolvedValue({
        success: false,
        authContext: null
      });
      mockCreateUserUseCase.mockRejectedValue(new Error('User with this email already exists'));

      const { ErrorHandler } = require('../../../../shared/middlewares/error-handler.middleware');
      ErrorHandler.handle.mockImplementation((error, res, context) => {
        res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });
}); 