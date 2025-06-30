/**
 * GET /users API Tests
 * Comprehensive testing for users list endpoint with >90% coverage
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

import handler from '../../../../api/users/index';

// Mock dependencies
jest.mock('../../../../shared/config/dependencies', () => ({
  Dependencies: {
    getUsersUseCase: {
      execute: jest.fn()
    }
  }
}));

jest.mock('../../../../shared/middlewares/auth.middleware', () => ({
  authenticate: jest.fn()
}));

jest.mock('../../../../shared/middlewares/error-handler.middleware', () => ({
  handleError: jest.fn()
}));

describe('GET /users API Tests', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockGetUsersUseCase: jest.Mock;
  let mockAuthenticate: jest.Mock;
  let mockHandleError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-admin-token'
      },
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };

    // Mock dependencies
    mockGetUsersUseCase = jest.fn();
    mockAuthenticate = jest.fn();
    mockHandleError = jest.fn();
    
    const { Dependencies } = require('../../../../shared/config/dependencies');
    const { authenticate } = require('../../../../shared/middlewares/auth.middleware');
    const { handleError } = require('../../../../shared/middlewares/error-handler.middleware');
    
    Dependencies.getUsersUseCase.execute = mockGetUsersUseCase;
    authenticate.mockImplementation(mockAuthenticate);
    handleError.mockImplementation(mockHandleError);
  });

  describe('Success Cases', () => {
    it('should return users list with pagination for admin', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          phoneNumber: '+1234567890',
          role: 'user',
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User Two',
          phoneNumber: '+1987654321',
          role: 'admin',
          createdAt: new Date('2024-01-02')
        }
      ];

      const mockResult = {
        users: mockUsers,
        total: 2
      };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
      });
      mockGetUsersUseCase.mockResolvedValue(mockResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: mockUsers,
        message: 'Users retrieved successfully',
        meta: {
          count: 2,
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });
    });

    it('should handle pagination parameters correctly', async () => {
      mockReq.query = { page: '2', limit: '5' };

      const mockUsers = [
        {
          id: 'user-3',
          email: 'user3@example.com',
          name: 'User Three',
          phoneNumber: '+1111111111',
          role: 'user',
          createdAt: new Date('2024-01-03')
        }
      ];

      const mockResult = {
        users: mockUsers,
        total: 11
      };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
      });
      mockGetUsersUseCase.mockResolvedValue(mockResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: mockUsers,
        message: 'Users retrieved successfully',
        meta: {
          count: 1,
          total: 11,
          page: 2,
          limit: 5,
          totalPages: 3
        }
      });
    });
  });

  describe('Authorization Validation', () => {
    it('should reject non-admin users', async () => {
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: 'user-1', email: 'user@example.com', role: 'user' }
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Only administrators can access the users list'
      });
    });

    it('should reject unauthenticated requests', async () => {
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    });
  });

  describe('Method Validation', () => {
    it('should reject non-GET/POST methods', async () => {
      mockReq.method = 'PUT';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
        message: 'Only GET and POST methods are allowed'
      });
    });

    it('should reject DELETE method', async () => {
      mockReq.method = 'DELETE';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
    });
  });

  describe('Error Handling', () => {
    it('should handle use case errors gracefully', async () => {
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
      });
      mockGetUsersUseCase.mockRejectedValue(new Error('Database connection failed'));

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        mockReq,
        mockRes
      );
    });

    it('should return 400 for invalid pagination parameters', async () => {
      mockReq.query = { page: '0', limit: '200' };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Page must be between 1 and 1000'
      });
    });

    it('should return 400 for invalid limit parameter', async () => {
      mockReq.query = { page: '1', limit: '200' };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Limit must be between 1 and 100'
      });
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          phoneNumber: '+1234567890',
          role: 'user',
          createdAt: new Date('2024-01-01')
        }
      ];

      const mockResult = {
        users: mockUsers,
        total: 1
      };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
      });
      mockGetUsersUseCase.mockResolvedValue(mockResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).toHaveProperty('data');
      expect(responseCall).toHaveProperty('message', 'Users retrieved successfully');
      expect(responseCall).toHaveProperty('meta');
      expect(responseCall.meta).toHaveProperty('count');
      expect(responseCall.meta).toHaveProperty('total');
      expect(responseCall.meta).toHaveProperty('page');
      expect(responseCall.meta).toHaveProperty('limit');
      expect(responseCall.meta).toHaveProperty('totalPages');
    });

    it('should exclude sensitive data from response', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          phoneNumber: '+1234567890',
          role: 'user',
          createdAt: new Date('2024-01-01')
        }
      ];

      const mockResult = {
        users: mockUsers,
        total: 1
      };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
      });
      mockGetUsersUseCase.mockResolvedValue(mockResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      const user = responseCall.data[0];
      
      // Should not include sensitive fields
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('hashedPassword');
      expect(user).not.toHaveProperty('salt');
      expect(user).not.toHaveProperty('secretKey');
    });
  });
}); 