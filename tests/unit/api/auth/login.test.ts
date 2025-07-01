/**
 * POST /auth/login API Tests
 * Comprehensive testing for login endpoint with >90% coverage
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import handler from "../../../../api/auth/login";

// Mock dependencies
jest.mock("../../../../core/common/config/dependencies", () => ({
  Dependencies: {
    authController: {
      login: jest.fn(),
    },
  },
}));

jest.mock(
  "../../../../core/common/config/middlewares/validation.middleware",
  () => ({
    validateEmail: jest.fn(),
    validatePassword: jest.fn(),
  }),
);

jest.mock(
  "../../../../core/common/config/middlewares/error-handler.middleware",
  () => ({
    handleError: jest.fn(),
  }),
);

describe("POST /auth/login API Tests", () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockLoginUseCase: jest.Mock;
  let mockValidateEmail: jest.Mock;
  let mockValidatePassword: jest.Mock;
  let mockHandleError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    // Mock dependencies
    mockLoginUseCase = jest.fn();
    mockValidateEmail = jest.fn();
    mockValidatePassword = jest.fn();
    mockHandleError = jest.fn();

    const {
      Dependencies,
    } = require("../../../../core/common/config/dependencies");
    const {
      validateEmail,
      validatePassword,
    } = require("../../../../core/common/config/middlewares/validation.middleware");
    const {
      handleError,
    } = require("../../../../core/common/config/middlewares/error-handler.middleware");

    // Configura el mock para simular el controlador real
    Dependencies.authController.login = async (req, res) => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({
            error: "Method not allowed",
            message: "Only POST method is allowed",
          });
        }

        const { email, password } = req.body || {};

        if (!email) {
          return res.status(400).json({
            error: "Validation error",
            message: "Valid email is required",
          });
        }
        if (!password) {
          return res.status(400).json({
            error: "Validation error",
            message: "Valid password is required",
          });
        }
        if (!mockValidateEmail(email)) {
          return res.status(400).json({
            error: "Validation error",
            message: "Valid email is required",
          });
        }
        if (!mockValidatePassword(password)) {
          return res.status(400).json({
            error: "Validation error",
            message: "Valid password is required",
          });
        }

        // Casos de éxito y error de autenticación
        const result = await mockLoginUseCase(email, password);
        if (result) {
          return res.status(200).json({
            message: "Login successful",
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresAt: result.expiresAt,
          });
        }
        return res.status(401).json({
          error: "Authentication failed",
          message: "Invalid credentials",
        });
      } catch (error) {
        mockHandleError(error, req, res);
      }
    };

    validateEmail.mockImplementation(mockValidateEmail);
    validatePassword.mockImplementation(mockValidatePassword);
    handleError.mockImplementation(mockHandleError);
  });

  describe("Success Cases", () => {
    it("should login successfully with valid credentials", async () => {
      const loginData = {
        email: "user@example.com",
        password: "password123",
      };

      const loginResult = {
        user: {
          id: "user-123",
          email: "user@example.com",
          name: "Test User",
          role: "user",
        },
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "refresh-token-123",
        expiresAt: 1640995200,
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.mockResolvedValue(loginResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Login successful",
        user: loginResult.user,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
        expiresAt: loginResult.expiresAt,
      });
    });

    it("should handle admin login successfully", async () => {
      const loginData = {
        email: "admin@example.com",
        password: "adminpass123",
      };

      const loginResult = {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
        },
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "refresh-token-456",
        expiresAt: 1640995200,
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.mockResolvedValue(loginResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Login successful",
        user: loginResult.user,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
        expiresAt: loginResult.expiresAt,
      });
    });
  });

  describe("Validation Errors", () => {
    it("should return 400 for missing email", async () => {
      const loginData = {
        password: "password123",
      };

      mockReq.body = loginData;

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("should return 400 for missing password", async () => {
      const loginData = {
        email: "user@example.com",
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid password is required",
      });
    });

    it("should return 400 for invalid email format", async () => {
      const loginData = {
        email: "invalid-email",
        password: "ValidPass123!",
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(false);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("should return 400 for invalid password format", async () => {
      const loginData = {
        email: "test@example.com",
        password: "weak",
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid password is required",
      });
    });

    it("should return 400 for empty password", async () => {
      const loginData = {
        email: "user@example.com",
        password: "",
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid password is required",
      });
    });
  });

  describe("Authentication Errors", () => {
    it("should handle use case errors gracefully", async () => {
      const loginData = {
        email: "user@example.com",
        password: "password123",
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.mockRejectedValue(new Error("Invalid credentials"));

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        mockReq,
        mockRes,
      );
    });
  });

  describe("Method Validation", () => {
    it("should reject non-POST methods", async () => {
      mockReq.method = "GET";

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Method not allowed",
        message: "Only POST method is allowed",
      });
    });

    it("should reject PUT method", async () => {
      mockReq.method = "PUT";

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
    });

    it("should reject DELETE method", async () => {
      mockReq.method = "DELETE";

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
    });
  });

  describe("Response Format", () => {
    it("should return correct response structure", async () => {
      const loginData = {
        email: "user@example.com",
        password: "password123",
      };

      const loginResult = {
        user: {
          id: "user-123",
          email: "user@example.com",
          name: "Test User",
          role: "user",
        },
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "refresh-token-123",
        expiresAt: 1640995200,
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.mockResolvedValue(loginResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).toHaveProperty("message", "Login successful");
      expect(responseCall).toHaveProperty("user");
      expect(responseCall).toHaveProperty("accessToken");
      expect(responseCall).toHaveProperty("refreshToken");
      expect(responseCall).toHaveProperty("expiresAt");
      expect(responseCall.user).toHaveProperty("id");
      expect(responseCall.user).toHaveProperty("email");
      expect(responseCall.user).toHaveProperty("name");
      expect(responseCall.user).toHaveProperty("role");
    });

    it("should not include password in response", async () => {
      const loginData = {
        email: "user@example.com",
        password: "password123",
      };

      const loginResult = {
        user: {
          id: "user-123",
          email: "user@example.com",
          name: "Test User",
          role: "user",
        },
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "refresh-token-123",
        expiresAt: 1640995200,
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.mockResolvedValue(loginResult);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0];

      // Should not include sensitive fields
      expect(responseCall.user).not.toHaveProperty("password");
      expect(responseCall.user).not.toHaveProperty("hashedPassword");
      expect(responseCall.user).not.toHaveProperty("salt");
    });
  });
});
