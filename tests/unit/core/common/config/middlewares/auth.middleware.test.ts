/**
 * Auth Middleware Tests
 * Comprehensive testing for authentication and authorization middleware with 100% coverage
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  authenticate,
  authorize,
  createAuthenticatedEndpoint,
} from "../../../../../../core/common/config/middlewares/auth.middleware";
import { UnauthorizedError } from "../../../../../../core/common/domain/exceptions/unauthorized.error";

// Mock dependencies
jest.mock("../../../../../../core/common/config/dependencies", () => ({
  Dependencies: {
    authService: {
      verifyToken: jest.fn(),
    },
    userRepository: {
      findByEmail: jest.fn(),
    },
  },
}));

describe("Auth Middleware", () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockAuthService: any;
  let mockUserRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
      method: "GET",
      query: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    const {
      Dependencies,
    } = require("../../../../../../core/common/config/dependencies");
    mockAuthService = Dependencies.authService;
    mockUserRepository = Dependencies.userRepository;
  });

  describe("authenticate function", () => {
    describe("Success Cases", () => {
      it("should authenticate user with valid token", async () => {
        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "ADMIN",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token-123",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: true,
          user: {
            id: "db-user-123",
            email: "test@example.com",
            role: "admin",
          },
        });

        expect(mockAuthService.verifyToken).toHaveBeenCalledWith(
          "valid-token-123",
        );
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
          "test@example.com",
        );
      });

      it("should authenticate user with lowercase role", async () => {
        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "USER",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token-123",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result.user?.role).toBe("user");
      });
    });

    describe("Token Extraction", () => {
      it("should return unauthenticated when no authorization header", async () => {
        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: false,
        });
      });

      it("should return unauthenticated when authorization header does not start with Bearer", async () => {
        mockReq.headers = {
          authorization: "Invalid valid-token-123",
        };

        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: false,
        });
      });

      it("should extract token correctly from Bearer header", async () => {
        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "ADMIN",
        };

        mockReq.headers = {
          authorization: "Bearer test-token-456",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        await authenticate(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(mockAuthService.verifyToken).toHaveBeenCalledWith(
          "test-token-456",
        );
      });
    });

    describe("Token Verification Errors", () => {
      it("should return unauthenticated when token verification fails", async () => {
        mockReq.headers = {
          authorization: "Bearer invalid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(null);

        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: false,
        });
      });

      it("should return unauthenticated when auth user has no id", async () => {
        const mockAuthUser = {
          email: "test@example.com",
          // No id
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);

        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: false,
        });
      });

      it("should return unauthenticated when auth user has no email", async () => {
        const mockAuthUser = {
          id: "auth-user-123",
          // No email
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);

        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: false,
        });
      });

      it("should return unauthenticated when user not found in database", async () => {
        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(null);

        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: false,
        });
      });

      it("should handle token verification exceptions", async () => {
        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockRejectedValue(
          new Error("Network error"),
        );

        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: false,
        });
      });

      it("should handle authentication exceptions", async () => {
        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockRejectedValue(
          new Error("Auth service error"),
        );

        const result = await authenticate(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: false,
        });
      });
    });
  });

  describe("authorize function", () => {
    describe("Success Cases", () => {
      it("should authorize user with correct role", async () => {
        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "ADMIN",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        const result = await authorize(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
          "admin",
        );

        expect(result).toEqual({
          isAuthenticated: true,
          user: {
            id: "db-user-123",
            email: "test@example.com",
            role: "admin",
          },
        });
      });

      it("should authorize without role requirement", async () => {
        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "USER",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        const result = await authorize(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(result).toEqual({
          isAuthenticated: true,
          user: {
            id: "db-user-123",
            email: "test@example.com",
            role: "user",
          },
        });
      });
    });

    describe("Authorization Errors", () => {
      it("should throw UnauthorizedError when not authenticated", async () => {
        mockReq.headers = {};

        await expect(
          authorize(mockReq as VercelRequest, mockRes as VercelResponse),
        ).rejects.toThrow(UnauthorizedError);
      });

      it("should throw UnauthorizedError when role does not match", async () => {
        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "USER",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        await expect(
          authorize(
            mockReq as VercelRequest,
            mockRes as VercelResponse,
            "admin",
          ),
        ).rejects.toThrow(UnauthorizedError);
      });
    });
  });

  describe("createAuthenticatedEndpoint function", () => {
    describe("Success Cases", () => {
      it("should create endpoint with default configuration", async () => {
        const endpoint = createAuthenticatedEndpoint();
        const handler = endpoint();

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      });

      it("should create endpoint with custom methods", async () => {
        const endpoint = createAuthenticatedEndpoint(["POST", "PUT"]);
        const handler = endpoint();

        mockReq.method = "POST";
        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      });

      it("should create endpoint with custom handler", async () => {
        const customHandler = jest.fn().mockResolvedValue({ data: "test" });
        const endpoint = createAuthenticatedEndpoint(["GET"], ["admin"]);
        const handler = endpoint(undefined, customHandler);

        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "ADMIN",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(customHandler).toHaveBeenCalledWith({
          authContext: {
            isAuthenticated: true,
            user: {
              id: "db-user-123",
              email: "test@example.com",
              role: "admin",
            },
          },
          pathParam: undefined,
          validatedBody: {},
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ data: "test" });
      });
    });

    describe("Method Validation", () => {
      it("should reject invalid method", async () => {
        const endpoint = createAuthenticatedEndpoint(["GET"]);
        const handler = endpoint();

        mockReq.method = "POST";

        const result = await handler(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(mockRes.status).toHaveBeenCalledWith(405);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Method not allowed",
          message: "Only GET methods are allowed",
        });
      });

      it("should accept valid method", async () => {
        const endpoint = createAuthenticatedEndpoint(["GET", "POST"]);
        const handler = endpoint();

        mockReq.method = "POST";

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      });
    });

    describe("Authentication in Endpoint", () => {
      it("should require authentication when roles are specified", async () => {
        const endpoint = createAuthenticatedEndpoint(["GET"], ["admin"]);
        const handler = endpoint();

        mockReq.headers = {};

        const result = await handler(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Unauthorized",
          message: "Authentication required",
        });
      });

      it("should authorize user with correct role", async () => {
        const endpoint = createAuthenticatedEndpoint(["GET"], ["admin"]);
        const handler = endpoint();

        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "ADMIN",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      });

      it("should reject user with incorrect role", async () => {
        const endpoint = createAuthenticatedEndpoint(["GET"], ["admin"]);
        const handler = endpoint();

        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "USER",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        const result = await handler(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Forbidden",
          message: "Access denied. Required roles: admin",
        });
      });
    });

    describe("Error Handling", () => {
      it("should handle handler exceptions", async () => {
        const customHandler = jest
          .fn()
          .mockRejectedValue(new Error("Handler error"));
        const endpoint = createAuthenticatedEndpoint(["GET"]);
        const handler = endpoint(undefined, customHandler);

        const mockAuthUser = {
          id: "auth-user-123",
          email: "test@example.com",
        };

        const mockDbUser = {
          id: "db-user-123",
          email: "test@example.com",
          role: "ADMIN",
        };

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
        mockUserRepository.findByEmail.mockResolvedValue(mockDbUser);

        const result = await handler(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Internal server error",
          message: "An unexpected error occurred",
        });
      });

      it("should handle authentication exceptions in endpoint", async () => {
        const endpoint = createAuthenticatedEndpoint(["GET"], ["admin"]);
        const handler = endpoint();

        mockReq.headers = {
          authorization: "Bearer valid-token",
        };

        mockAuthService.verifyToken.mockRejectedValue(new Error("Auth error"));

        const result = await handler(
          mockReq as VercelRequest,
          mockRes as VercelResponse,
        );

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Unauthorized",
          message: "Authentication required",
        });
      });
    });
  });
});
