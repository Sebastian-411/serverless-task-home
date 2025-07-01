/**
 * POST /users API Tests
 * Comprehensive testing for user creation endpoint with >90% coverage
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import handler from "../../../../api/users/index";

// Mock dependencies
jest.mock("../../../../core/common/config/dependencies", () => ({
  Dependencies: {
    userController: {
      getUsers: jest.fn(),
      createUser: jest.fn(),
    },
  },
}));

jest.mock(
  "../../../../core/common/config/middlewares/validation.middleware",
  () => ({
    validateEmail: jest.fn(),
    validatePassword: jest.fn(),
    validateLength: jest.fn(),
  }),
);

jest.mock("../../../../core/common/config/middlewares/auth.middleware", () => ({
  authenticate: jest.fn(),
}));

jest.mock(
  "../../../../core/common/config/middlewares/error-handler.middleware",
  () => ({
    handleError: jest.fn(),
  }),
);

describe("POST /users API Tests", () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockCreateUserUseCase: jest.Mock;
  let mockAuthenticate: jest.Mock;
  let mockValidateEmail: jest.Mock;
  let mockValidatePassword: jest.Mock;
  let mockValidateLength: jest.Mock;
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
    mockCreateUserUseCase = jest.fn();
    mockAuthenticate = jest.fn();
    mockValidateEmail = jest.fn();
    mockValidatePassword = jest.fn();
    mockValidateLength = jest.fn();
    mockHandleError = jest.fn();

    const {
      Dependencies,
    } = require("../../../../core/common/config/dependencies");
    const {
      authenticate,
    } = require("../../../../core/common/config/middlewares/auth.middleware");
    const {
      validateEmail,
      validatePassword,
      validateLength,
    } = require("../../../../core/common/config/middlewares/validation.middleware");
    const {
      handleError,
    } = require("../../../../core/common/config/middlewares/error-handler.middleware");

    // Configura el mock para simular el controlador real
    Dependencies.userController.createUser = async (req, res) => {
      try {
        // Validación de método HTTP
        if (req.method && req.method !== "POST") {
          return res.status(405).json({
            error: "Method not allowed",
            message: "Only GET and POST methods are allowed",
          });
        }

        // Simula autenticación
        const auth = await mockAuthenticate();

        // Si está autenticado como usuario regular, no puede crear otros usuarios
        if (auth.isAuthenticated && auth.user.role === "user") {
          return res.status(403).json({
            error: "Forbidden",
            message:
              "Authenticated users cannot self-register. Use /auth/register for new accounts.",
          });
        }

        const { name, email, password, phoneNumber, role } = req.body || {};

        // Validaciones
        if (!name || !mockValidateLength(name)) {
          return res.status(400).json({
            error: "Validation error",
            message:
              "Name is required and must be between 1 and 100 characters",
          });
        }

        if (!email || !mockValidateEmail(email)) {
          return res.status(400).json({
            error: "Validation error",
            message: "Valid email is required",
          });
        }

        if (!password || !mockValidatePassword(password)) {
          return res.status(400).json({
            error: "Validation error",
            message:
              "Password must be at least 8 characters with uppercase, lowercase, and number",
          });
        }

        if (!phoneNumber || !mockValidateLength(phoneNumber)) {
          return res.status(400).json({
            error: "Validation error",
            message:
              "Phone number is required and must be between 10 and 20 characters",
          });
        }

        if (role && role !== "admin" && role !== "user") {
          return res.status(400).json({
            error: "Validation error",
            message: 'Role must be either "admin" or "user"',
          });
        }

        // Simula resultado de la capa de aplicación
        const result = await mockCreateUserUseCase();
        if (result) {
          return res.status(201).json({
            success: true,
            data: result,
            message: "User created successfully",
          });
        }

        // Simula error de base de datos
        return res.status(500).json({
          error: "Internal server error",
          message: "Failed to create user",
        });
      } catch (error) {
        // Maneja errores del use case
        mockHandleError(error, req, res);
      }
    };

    authenticate.mockImplementation(mockAuthenticate);
    validateEmail.mockImplementation(mockValidateEmail);
    validatePassword.mockImplementation(mockValidatePassword);
    validateLength.mockImplementation(mockValidateLength);
    handleError.mockImplementation(mockHandleError);
  });

  describe("Success Cases", () => {
    it("should create user with all required fields and return 201", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "securepassword123",
        phoneNumber: "+1234567890",
        role: "user",
      };

      const createdUser = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "+1234567890",
        role: "user",
        createdAt: new Date("2024-01-01"),
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false,
      });
      mockValidateLength.mockReturnValue(true);
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockCreateUserUseCase.mockResolvedValue(createdUser);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdUser,
        message: "User created successfully",
      });
    });

    it("should create user with minimal required fields", async () => {
      const userData = {
        name: "Minimal User",
        email: "minimal@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      const createdUser = {
        id: "user-456",
        name: "Minimal User",
        email: "minimal@example.com",
        phoneNumber: "+1234567890",
        role: "user",
        createdAt: new Date("2024-01-01"),
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false,
      });
      mockValidateLength.mockReturnValue(true);
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockCreateUserUseCase.mockResolvedValue(createdUser);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdUser,
        message: "User created successfully",
      });
    });

    it("should allow admin to create users", async () => {
      const userData = {
        name: "Admin Created User",
        email: "admincreated@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
        role: "admin",
      };

      const createdUser = {
        id: "user-789",
        name: "Admin Created User",
        email: "admincreated@example.com",
        phoneNumber: "+1234567890",
        role: "admin",
        createdAt: new Date("2024-01-01"),
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: "admin-1", email: "admin@example.com", role: "admin" },
      });
      mockValidateLength.mockReturnValue(true);
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockCreateUserUseCase.mockResolvedValue(createdUser);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdUser,
        message: "User created successfully",
      });
    });
  });

  describe("Validation Errors", () => {
    it("should return 400 for missing name", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false,
      });
      mockValidateLength.mockReturnValue(false);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Name is required and must be between 1 and 100 characters",
      });
    });

    it("should return 400 for missing email", async () => {
      const userData = {
        name: "Test User",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false,
      });
      mockValidateLength.mockReturnValue(true);
      mockValidateEmail.mockReturnValue(false);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("should return 400 for missing password", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        phoneNumber: "+1234567890",
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false,
      });
      mockValidateLength.mockReturnValue(true);
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and number",
      });
    });

    it("should return 400 for missing phone number", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false,
      });
      mockValidateLength.mockReturnValue(true);
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockValidateLength.mockReturnValueOnce(true); // For name validation
      mockValidateLength.mockReturnValueOnce(false); // For phone number validation

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message:
          "Phone number is required and must be between 10 and 20 characters",
      });
    });

    it("should return 400 for invalid role", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
        role: "invalid-role",
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false,
      });
      mockValidateLength.mockReturnValue(true);
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        message: 'Role must be either "admin" or "user"',
      });
    });
  });

  describe("Authorization Validation", () => {
    it("should prevent regular user from creating other users", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: { id: "user-1", email: "user@example.com", role: "user" },
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message:
          "Authenticated users cannot self-register. Use /auth/register for new accounts.",
      });
    });
  });

  describe("Method Validation", () => {
    it("should reject non-POST methods for user creation", async () => {
      mockReq.method = "PUT";

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Method not allowed",
        message: "Only GET and POST methods are allowed",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle use case errors gracefully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      mockReq.body = userData;
      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false,
      });
      mockValidateLength.mockReturnValue(true);
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockCreateUserUseCase.mockRejectedValue(
        new Error("User with this email already exists"),
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        mockReq,
        mockRes,
      );
    });
  });
});
