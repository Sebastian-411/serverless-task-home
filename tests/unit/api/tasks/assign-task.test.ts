import type { VercelRequest, VercelResponse } from "@vercel/node";

import handler from "../../../../api/tasks/[id]/assign";
import { authenticate } from "../../../../core/common/config/middlewares/auth.middleware";

// Mock del middleware de autenticación
jest.mock("../../../../core/common/config/middlewares/auth.middleware");
const mockAuthenticate = authenticate as jest.MockedFunction<
  typeof authenticate
>;

// Mock del controlador HTTP
jest.mock(
  "../../../../core/task/infrastructure/adapters/in/http-task-controller",
);
import { HttpTaskController } from "../../../../core/task/infrastructure/adapters/in/http-task-controller";
const MockHttpTaskController = HttpTaskController as jest.MockedClass<
  typeof HttpTaskController
>;

describe("POST /tasks/:id/assign", () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockAssignTask: jest.Mock;

  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();

    // Configurar mock del controlador
    mockAssignTask = jest.fn();
    MockHttpTaskController.prototype.assignTask = mockAssignTask;

    // Configurar request mock
    mockReq = {
      method: "POST",
      query: {
        id: "123e4567-e89b-12d3-a456-426614174000",
      },
      body: {
        userId: "123e4567-e89b-12d3-a456-426614174001",
      },
    };

    // Configurar response mock
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });

  it("debería manejar POST correctamente", async () => {
    // Arrange
    mockAssignTask.mockResolvedValue(undefined);

    // Act
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    // Assert
    expect(mockAssignTask).toHaveBeenCalledWith(mockReq, mockRes);
  });

  it("debería retornar 405 para métodos no permitidos", async () => {
    // Arrange
    mockReq.method = "GET";

    // Act
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("debería retornar 405 para método PUT", async () => {
    // Arrange
    mockReq.method = "PUT";

    // Act
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("debería retornar 405 para método DELETE", async () => {
    // Arrange
    mockReq.method = "DELETE";

    // Act
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });
});
