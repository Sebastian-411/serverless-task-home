import type { VercelRequest, VercelResponse } from "@vercel/node";

import { HttpAuthController } from "../../../../../../../core/auth/infrastructure/adapters/in/http-auth-controller";
import type { LoginUseCase } from "../../../../../../../core/auth/application/login.usecase";
import {
  validateEmail,
  validatePassword,
} from "../../../../../../../core/common/config/middlewares/validation.middleware";
import { handleError } from "../../../../../../../core/common/config/middlewares/error-handler.middleware";

// Mock validation middleware
jest.mock(
  "../../../../../../../core/common/config/middlewares/validation.middleware",
);
jest.mock(
  "../../../../../../../core/common/config/middlewares/error-handler.middleware",
);

const mockValidateEmail = validateEmail as jest.MockedFunction<
  typeof validateEmail
>;
const mockValidatePassword = validatePassword as jest.MockedFunction<
  typeof validatePassword
>;
const mockHandleError = handleError as jest.MockedFunction<typeof handleError>;

describe("HttpAuthController", () => {
  let controller: HttpAuthController;
  let mockLoginUseCase: jest.Mocked<LoginUseCase>;
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock LoginUseCase
    mockLoginUseCase = {
      execute: jest.fn(),
    } as any;

    // Mock response methods
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    // Mock request and response
    mockReq = {
      method: "POST",
      url: "/api/auth/login",
      body: {},
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
    };

    controller = new HttpAuthController(mockLoginUseCase);
  });

  describe("login", () => {
    it("maneja login exitoso con credenciales válidas", async () => {
      const loginData = {
        email: "test@example.com",
        password: "ValidPass123",
      };

      const loginResult = {
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          role: "USER",
        },
        token: "jwt-token-123",
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.execute.mockResolvedValue(loginResult);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidateEmail).toHaveBeenCalledWith("test@example.com");
      expect(mockValidatePassword).toHaveBeenCalledWith("ValidPass123");
      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(loginData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Login successful",
        user: loginResult.user,
        token: loginResult.token,
      });
    });

    it("rechaza método GET", async () => {
      mockReq.method = "GET";

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Method not allowed",
        message: "Only POST method is allowed",
      });
      expect(mockLoginUseCase.execute).not.toHaveBeenCalled();
    });

    it("rechaza método PUT", async () => {
      mockReq.method = "PUT";

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Method not allowed",
        message: "Only POST method is allowed",
      });
    });

    it("rechaza método DELETE", async () => {
      mockReq.method = "DELETE";

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Method not allowed",
        message: "Only POST method is allowed",
      });
    });

    it("rechaza email faltante", async () => {
      mockReq.body = { password: "ValidPass123" };

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
      expect(mockLoginUseCase.execute).not.toHaveBeenCalled();
    });

    it("rechaza email vacío", async () => {
      mockReq.body = { email: "", password: "ValidPass123" };

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("rechaza email inválido", async () => {
      mockReq.body = { email: "invalid-email", password: "ValidPass123" };
      mockValidateEmail.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidateEmail).toHaveBeenCalledWith("invalid-email");
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("rechaza password faltante", async () => {
      mockReq.body = { email: "test@example.com" };

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
      expect(mockLoginUseCase.execute).not.toHaveBeenCalled();
    });

    it("rechaza password vacío", async () => {
      mockReq.body = { email: "test@example.com", password: "" };

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("rechaza password inválido", async () => {
      mockReq.body = { email: "test@example.com", password: "weak" };
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidatePassword).toHaveBeenCalledWith("weak");
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and number",
      });
    });

    it("rechaza email y password inválidos", async () => {
      mockReq.body = { email: "invalid", password: "weak" };
      mockValidateEmail.mockReturnValue(false);
      mockValidatePassword.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidateEmail).toHaveBeenCalledWith("invalid");
      expect(mockValidatePassword).not.toHaveBeenCalled(); // Se detiene en la primera validación
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("maneja error del caso de uso", async () => {
      const loginData = {
        email: "test@example.com",
        password: "ValidPass123",
      };

      const error = new Error("Invalid credentials");

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.execute.mockRejectedValue(error);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(loginData);
      expect(mockHandleError).toHaveBeenCalledWith(error, mockReq, mockRes);
    });

    it("maneja error inesperado", async () => {
      const loginData = {
        email: "test@example.com",
        password: "ValidPass123",
      };

      const error = new Error("Unexpected error");

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.execute.mockRejectedValue(error);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockHandleError).toHaveBeenCalledWith(error, mockReq, mockRes);
    });

    it("maneja error de validación de email con caracteres especiales", async () => {
      mockReq.body = {
        email: "test@example.com<script>",
        password: "ValidPass123",
      };
      mockValidateEmail.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidateEmail).toHaveBeenCalledWith(
        "test@example.com<script>",
      );
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("maneja error de validación de password con caracteres especiales", async () => {
      mockReq.body = { email: "test@example.com", password: "pass<script>" };
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidatePassword).toHaveBeenCalledWith("pass<script>");
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and number",
      });
    });

    it("maneja body vacío", async () => {
      mockReq.body = {};

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("maneja body null", async () => {
      mockReq.body = null;

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("maneja body undefined", async () => {
      mockReq.body = undefined;

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("maneja email con espacios en blanco", async () => {
      mockReq.body = {
        email: "  test@example.com  ",
        password: "ValidPass123",
      };
      mockValidateEmail.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidateEmail).toHaveBeenCalledWith("  test@example.com  ");
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message: "Valid email is required",
      });
    });

    it("maneja password con espacios en blanco", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "  ValidPass123  ",
      };
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidatePassword).toHaveBeenCalledWith("  ValidPass123  ");
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Validation error",
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and number",
      });
    });
  });

  describe("logging", () => {
    let consoleSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "log").mockImplementation();
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("registra log cuando recibe request de login", async () => {
      const loginData = {
        email: "test@example.com",
        password: "ValidPass123",
      };

      const loginResult = {
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          role: "USER",
        },
        token: "jwt-token-123",
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.execute.mockResolvedValue(loginResult);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[HttpAuthController] Received login request",
        {
          method: "POST",
          path: "/api/auth/login",
        },
      );
    });

    it("registra log cuando valida credenciales", async () => {
      const loginData = {
        email: "test@example.com",
        password: "ValidPass123",
      };

      const loginResult = {
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          role: "USER",
        },
        token: "jwt-token-123",
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.execute.mockResolvedValue(loginResult);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[HttpAuthController] Credentials validated. Executing use case.",
        {
          email: "test@example.com",
        },
      );
    });

    it("registra log cuando login es exitoso", async () => {
      const loginData = {
        email: "test@example.com",
        password: "ValidPass123",
      };

      const loginResult = {
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          role: "USER",
        },
        token: "jwt-token-123",
      };

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.execute.mockResolvedValue(loginResult);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[HttpAuthController] Login successful",
        {
          userId: "user-1",
          email: "test@example.com",
          role: "USER",
        },
      );
    });

    it("registra warning cuando método no está permitido", async () => {
      mockReq.method = "GET";

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[HttpAuthController] Method not allowed",
        {
          method: "GET",
        },
      );
    });

    it("registra warning cuando validación de email falla", async () => {
      mockReq.body = { email: "invalid-email", password: "ValidPass123" };
      mockValidateEmail.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[HttpAuthController] Email validation failed",
        {
          email: "invalid-email",
        },
      );
    });

    it("registra warning cuando validación de password falla", async () => {
      mockReq.body = { email: "test@example.com", password: "weak" };
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[HttpAuthController] Password validation failed",
      );
    });

    it("registra error cuando ocurre error inesperado", async () => {
      const loginData = {
        email: "test@example.com",
        password: "ValidPass123",
      };

      const error = new Error("Unexpected error");

      mockReq.body = loginData;
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(true);
      mockLoginUseCase.execute.mockRejectedValue(error);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[HttpAuthController] Unexpected error occurred during login",
        {
          error: "Unexpected error",
          path: "/api/auth/login",
        },
      );
    });
  });

  describe("constructor", () => {
    it("inicializa correctamente con LoginUseCase", () => {
      expect(() => new HttpAuthController(mockLoginUseCase)).not.toThrow();
    });

    it("acepta LoginUseCase como dependencia", () => {
      const controller = new HttpAuthController(mockLoginUseCase);
      expect(controller).toBeInstanceOf(HttpAuthController);
    });
  });

  describe("edge cases", () => {
    it("maneja email con caracteres Unicode", async () => {
      mockReq.body = { email: "test@exámple.com", password: "ValidPass123" };
      mockValidateEmail.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidateEmail).toHaveBeenCalledWith("test@exámple.com");
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("maneja password con caracteres Unicode", async () => {
      mockReq.body = { email: "test@example.com", password: "Páss123" };
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidatePassword).toHaveBeenCalledWith("Páss123");
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("maneja email muy largo", async () => {
      const longEmail = "a".repeat(100) + "@example.com";
      mockReq.body = { email: longEmail, password: "ValidPass123" };
      mockValidateEmail.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidateEmail).toHaveBeenCalledWith(longEmail);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("maneja password muy largo", async () => {
      const longPassword = "A".repeat(100) + "a".repeat(100) + "1".repeat(100);
      mockReq.body = { email: "test@example.com", password: longPassword };
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidatePassword).toHaveBeenCalledWith(longPassword);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("maneja email con múltiples @", async () => {
      mockReq.body = { email: "test@@example.com", password: "ValidPass123" };
      mockValidateEmail.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidateEmail).toHaveBeenCalledWith("test@@example.com");
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("maneja password con solo números", async () => {
      mockReq.body = { email: "test@example.com", password: "12345678" };
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidatePassword).toHaveBeenCalledWith("12345678");
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("maneja password con solo letras", async () => {
      mockReq.body = { email: "test@example.com", password: "abcdefgh" };
      mockValidateEmail.mockReturnValue(true);
      mockValidatePassword.mockReturnValue(false);

      await controller.login(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockValidatePassword).toHaveBeenCalledWith("abcdefgh");
      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });
});
