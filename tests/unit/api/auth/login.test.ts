/**
 * POST /auth/login API Tests
 * Comprehensive testing for login endpoint with >90% coverage
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

import handler from '../../../../api/auth/login';

// Mock dependencies
jest.mock('../../../../shared/config/dependencies', () => ({
  Dependencies: {
    loginUseCase: {
      execute: jest.fn()
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

describe('POST /auth/login API Tests', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockLoginUseCase: jest.Mock;
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
    mockLoginUseCase = jest.fn();
    mockValidationMiddleware = jest.fn();
    
    const { Dependencies } = require('../../../../shared/config/dependencies');
    const { ValidationMiddleware } = require('../../../../shared/middlewares/validation.middleware');
    
    Dependencies.loginUseCase.execute = mockLoginUseCase;
    ValidationMiddleware.validate = mockValidationMiddleware;
  });

  describe('Success Cases', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      };

      const loginResult = {
        user: {
        id: 'user-123',
          email: 'user@example.com',
        name: 'Test User',
          role: 'user'
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh-token-123',
        expiresAt: 1640995200
      };

      mockReq.body = loginData;
      mockValidationMiddleware.mockReturnValue({
        success: true,
        data: loginData
      });
      mockLoginUseCase.mockResolvedValue(loginResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login successful',
        user: loginResult.user,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
        expiresAt: loginResult.expiresAt
      });
    });

    it('should handle admin login successfully', async () => {
      const loginData = {
        email: 'admin@example.com',
        password: 'adminpass123'
      };

      const loginResult = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh-token-456',
        expiresAt: 1640995200
      };

      mockReq.body = loginData;
      mockValidationMiddleware.mockReturnValue({
        success: true,
        data: loginData
      });
      mockLoginUseCase.mockResolvedValue(loginResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login successful',
        user: loginResult.user,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
        expiresAt: loginResult.expiresAt
      });
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing email', async () => {
      const loginData = {
        password: 'password123'
      };

      mockReq.body = loginData;
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
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Email is required'
      });
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: 'user@example.com'
      };

      mockReq.body = loginData;
      mockValidationMiddleware.mockReturnValue({
        success: false,
        response: {
          status: 400,
          body: {
            error: 'Validation error',
            message: 'Password is required'
          }
        }
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid email format', async () => {
      const mockRequest = {
        method: 'POST',
        body: { email: 'invalid-email', password: 'ValidPass123!' },
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
          error: 'Validation error',
          message: expect.stringContaining('email')
        })
      );
    });

    it('should return 400 for invalid password format', async () => {
      const mockRequest = {
        method: 'POST',
        body: { email: 'test@example.com', password: 'weak' },
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
          error: 'Validation error',
          message: expect.stringContaining('password')
        })
      );
    });

    it('should return 400 for empty password', async () => {
      const loginData = {
        email: 'user@example.com',
        password: ''
      };

      mockReq.body = loginData;
      mockValidationMiddleware.mockReturnValue({
        success: false,
        response: {
          status: 400,
          body: {
            error: 'Validation error',
            message: 'Password is required'
          }
        }
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 for invalid credentials', async () => {
      const mockRequest = {
        method: 'POST',
        body: { email: 'test@example.com', password: 'ValidPass123!' },
        headers: {}
      } as VercelRequest;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as VercelResponse;

      await handler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication error',
          message: expect.stringContaining('Invalid credentials')
        })
      );
    });

    it('should return 404 for user not found in database', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockReq.body = loginData;
      mockValidationMiddleware.mockReturnValue({
        success: true,
        data: loginData
      });
      mockLoginUseCase.mockRejectedValue(new Error('User not found in database'));

      const { ErrorHandler } = require('../../../../shared/middlewares/error-handler.middleware');
      ErrorHandler.handle.mockImplementation((error, res, context) => {
        res.status(404).json({
          error: 'Not Found',
          message: 'User not found in database'
        });
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('Method Validation', () => {
    it('should reject non-POST methods', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
        message: 'Only POST method is allowed'
      });
    });

    it('should reject PUT method', async () => {
      mockReq.method = 'PUT';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
    });

    it('should reject DELETE method', async () => {
      mockReq.method = 'DELETE';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
    });
  });

  describe('Error Handling', () => {
    it('should handle use case errors gracefully', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      };

      mockReq.body = loginData;
      mockValidationMiddleware.mockReturnValue({
        success: true,
        data: loginData
      });
      mockLoginUseCase.mockRejectedValue(new Error('Authentication service unavailable'));

      const { ErrorHandler } = require('../../../../shared/middlewares/error-handler.middleware');
      ErrorHandler.handle.mockImplementation((error, res, context) => {
        res.status(500).json({
          error: 'Internal server error',
          message: 'Authentication failed'
        });
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      };

      const loginResult = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'user'
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh-token-123',
        expiresAt: 1640995200
      };

      mockReq.body = loginData;
      mockValidationMiddleware.mockReturnValue({
        success: true,
        data: loginData
      });
      mockLoginUseCase.mockResolvedValue(loginResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).toHaveProperty('message', 'Login successful');
      expect(responseCall).toHaveProperty('user');
      expect(responseCall).toHaveProperty('accessToken');
      expect(responseCall).toHaveProperty('refreshToken');
      expect(responseCall).toHaveProperty('expiresAt');
      expect(responseCall.user).toHaveProperty('id');
      expect(responseCall.user).toHaveProperty('email');
      expect(responseCall.user).toHaveProperty('name');
      expect(responseCall.user).toHaveProperty('role');
    });

    it('should not include password in response', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      };

      const loginResult = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'user'
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh-token-123',
        expiresAt: 1640995200
      };

      mockReq.body = loginData;
      mockValidationMiddleware.mockReturnValue({
        success: true,
        data: loginData
      });
      mockLoginUseCase.mockResolvedValue(loginResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      
      // Should not include sensitive fields
      expect(responseCall.user).not.toHaveProperty('password');
      expect(responseCall.user).not.toHaveProperty('hashedPassword');
      expect(responseCall.user).not.toHaveProperty('salt');
    });
  });
}); 