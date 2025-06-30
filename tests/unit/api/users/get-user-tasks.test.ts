import type { VercelRequest, VercelResponse } from "@vercel/node";

// Mock del middleware de autenticación
jest.mock("../../../../core/common/config/middlewares/auth.middleware");
import { authenticate } from "../../../../core/common/config/middlewares/auth.middleware";
const mockAuthenticate = authenticate as jest.MockedFunction<
  typeof authenticate
>;

// Mock del controlador HTTP
const mockGetUserTasks = jest.fn();
jest.mock(
  "../../../../core/task/infrastructure/adapters/in/http-task-controller",
  () => {
    return {
      HttpTaskController: jest.fn().mockImplementation(() => ({
        getUserTasks: mockGetUserTasks,
      })),
    };
  },
);
import handler from "../../../../api/users/[id]/tasks";
import { HttpTaskController } from "../../../../core/task/infrastructure/adapters/in/http-task-controller";

describe("GET /users/:id/tasks", () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockSetHeader = jest.fn();

    mockRes = {
      status: mockStatus,
      json: mockJson,
      setHeader: mockSetHeader,
    };

    jest.clearAllMocks();
    mockGetUserTasks.mockClear();
  });

  describe("GET method", () => {
    it("debería manejar petición GET correctamente", async () => {
      // Arrange
      mockReq = {
        method: "GET",
        query: { id: "user-123" },
      };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: {
          id: "admin-456",
          email: "admin@example.com",
          role: "admin",
        },
      });

      // Act
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Assert
      expect(mockGetUserTasks).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it("debería retornar 405 para métodos no permitidos", async () => {
      // Arrange
      mockReq = {
        method: "POST",
        query: { id: "user-123" },
      };

      // Act
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Assert
      expect(mockSetHeader).toHaveBeenCalledWith("Allow", ["GET"]);
      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({ error: "Método no permitido" });
    });
  });

  describe("Autenticación", () => {
    it("debería manejar usuario no autenticado", async () => {
      // Arrange
      mockReq = {
        method: "GET",
        query: { id: "user-123" },
      };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: false,
        user: null,
      });

      // Act
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Assert
      expect(mockGetUserTasks).toHaveBeenCalled();
    });

    it("debería manejar usuario autenticado", async () => {
      // Arrange
      mockReq = {
        method: "GET",
        query: { id: "user-123" },
      };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "user",
        },
      });

      // Act
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Assert
      expect(mockGetUserTasks).toHaveBeenCalled();
    });
  });

  describe("Parámetros de query", () => {
    it("debería pasar parámetros de query al controlador", async () => {
      // Arrange
      mockReq = {
        method: "GET",
        query: {
          id: "user-123",
          status: "PENDING",
          priority: "HIGH",
          page: "2",
          limit: "5",
        },
      };

      mockAuthenticate.mockResolvedValue({
        isAuthenticated: true,
        user: {
          id: "admin-456",
          email: "admin@example.com",
          role: "admin",
        },
      });

      // Act
      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Assert
      expect(mockGetUserTasks).toHaveBeenCalledWith(mockReq, mockRes);
    });
  });
});
