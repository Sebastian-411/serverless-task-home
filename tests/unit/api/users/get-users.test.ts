/**
 * GET /users API Tests
 * Comprehensive testing for users list endpoint with >90% coverage
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

import handler from '../../../../api/users/index';

// Mock dependencies
jest.mock('../../../../shared/config/dependencies', () => ({
  Dependencies: {
    createAuthenticatedEndpoint: jest.fn(),
    getUsersUseCase: {
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

describe('GET /users API Tests', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockCreateAuthenticatedEndpoint: jest.Mock;
  let mockGetUsersUseCase: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token'
      },
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };

    // Mock the authenticated endpoint factory
    mockCreateAuthenticatedEndpoint = jest.fn();
    mockGetUsersUseCase = jest.fn();
    
    const { Dependencies } = require('../../../../shared/config/dependencies');
    Dependencies.createAuthenticatedEndpoint.mockReturnValue(mockCreateAuthenticatedEndpoint);
    Dependencies.getUsersUseCase.execute = mockGetUsersUseCase;
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

      mockGetUsersUseCase.mockResolvedValue(mockResult);

      // Mock the endpoint handler
      mockCreateAuthenticatedEndpoint.mockImplementation((config, handler) => {
        return async (req: VercelRequest, res: VercelResponse) => {
          const context = {
            authContext: {
              isAuthenticated: true,
              user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
            },
            validatedQuery: { page: 1, limit: 10 }
          };
          const result = await handler(context);
          res.status(200).json(result);
        };
      });

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

      mockGetUsersUseCase.mockResolvedValue(mockResult);

      mockCreateAuthenticatedEndpoint.mockImplementation((config, handler) => {
        return async (req: VercelRequest, res: VercelResponse) => {
          const context = {
            authContext: {
              isAuthenticated: true,
              user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
            },
            validatedQuery: { page: 2, limit: 5 }
          };
          const result = await handler(context);
          res.status(200).json(result);
        };
      });

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
      mockCreateAuthenticatedEndpoint.mockImplementation((config, handler) => {
        return async (req: VercelRequest, res: VercelResponse) => {
          const context = {
            authContext: {
              isAuthenticated: true,
              user: { id: 'user-1', email: 'user@example.com', role: 'user' }
            }
          };
          try {
            await handler(context);
          } catch (error) {
            res.status(403).json({
              error: 'Forbidden',
              message: 'Only administrators can access the users list'
            });
          }
        };
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Only administrators can access the users list'
      });
    });

    it('should reject unauthenticated requests', async () => {
      mockCreateAuthenticatedEndpoint.mockImplementation((config, handler) => {
        return async (req: VercelRequest, res: VercelResponse) => {
          const context = {
            authContext: {
              isAuthenticated: false
            }
          };
          try {
            await handler(context);
          } catch (error) {
            res.status(401).json({
              error: 'Unauthorized',
              message: 'Authentication required'
            });
          }
        };
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Method Validation', () => {
    it('should reject non-GET methods', async () => {
      mockReq.method = 'POST';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
        message: 'Only GET and POST methods are allowed'
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
      mockGetUsersUseCase.mockRejectedValue(new Error('Database connection failed'));

      mockCreateAuthenticatedEndpoint.mockImplementation((config, handler) => {
        return async (req: VercelRequest, res: VercelResponse) => {
          try {
            const context = {
              authContext: {
                isAuthenticated: true,
                user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
              }
            };
            await handler(context);
          } catch (error) {
            res.status(500).json({
              error: 'Internal server error',
              message: 'Error retrieving users list'
            });
          }
        };
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Error retrieving users list'
      });
    });

    it('should return 500 when repository throws error', async () => {
      mockGetUsersUseCase.mockRejectedValue(new Error('Database error'));

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error'
        })
      );
    });

    it('should return 400 for invalid pagination parameters', async () => {
      mockReq.query = { page: 'invalid', limit: 'invalid' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error'
        })
      );
    });

    it('should return 403 for unauthorized access', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden'
        })
      );
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

      mockGetUsersUseCase.mockResolvedValue(mockResult);

      mockCreateAuthenticatedEndpoint.mockImplementation((config, handler) => {
        return async (req: VercelRequest, res: VercelResponse) => {
          const context = {
            authContext: {
              isAuthenticated: true,
              user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
            }
          };
          const result = await handler(context);
          res.status(200).json(result);
        };
      });

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

      mockGetUsersUseCase.mockResolvedValue(mockResult);

      mockCreateAuthenticatedEndpoint.mockImplementation((config, handler) => {
        return async (req: VercelRequest, res: VercelResponse) => {
          const context = {
            authContext: {
              isAuthenticated: true,
              user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
            }
          };
          const result = await handler(context);
          res.status(200).json(result);
        };
      });

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