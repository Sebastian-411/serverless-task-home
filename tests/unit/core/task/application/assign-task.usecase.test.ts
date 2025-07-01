import { AssignTaskUseCase } from "../../../../../core/task/application/assign-task.usecase";
import {
  Task,
  TaskStatus,
  TaskPriority,
} from "../../../../../core/task/domain";
import type { TaskRepositoryPort } from "../../../../../core/task/application/get-tasks.usecase";

// Mock del repositorio
const mockTaskRepository: jest.Mocked<TaskRepositoryPort> = {
  findTasks: jest.fn(),
  findTaskById: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  findRecentTasks: jest.fn(),
  findRecentTasksByUser: jest.fn(),
};

describe("AssignTaskUseCase", () => {
  let assignTaskUseCase: AssignTaskUseCase;
  let mockTask: Task;

  beforeEach(() => {
    assignTaskUseCase = new AssignTaskUseCase(mockTaskRepository);

    // Crear una tarea mock
    mockTask = new Task({
      id: "123e4567-e89b-12d3-a456-426614174000",
      title: "Tarea de prueba",
      description: "Descripción de prueba",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      createdBy: "123e4567-e89b-12d3-a456-426614174001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Limpiar todos los mocks
    jest.clearAllMocks();
  });

  describe("assignTask", () => {
    const taskId = "123e4567-e89b-12d3-a456-426614174000";
    const assignToUserId = "123e4567-e89b-12d3-a456-426614174002";
    const currentUserId = "123e4567-e89b-12d3-a456-426614174003";

    it("debería asignar una tarea exitosamente cuando el usuario es ADMIN", async () => {
      // Arrange
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.updateTask.mockResolvedValue(mockTask);

      // Act
      const result = await assignTaskUseCase.assignTask(
        taskId,
        assignToUserId,
        currentUserId,
        "ADMIN",
      );

      // Assert
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith(taskId);
      expect(mockTaskRepository.updateTask).toHaveBeenCalledWith(taskId, {
        assignedTo: assignToUserId,
      });
      expect(result.task).toBe(mockTask);
      expect(result.message).toContain("asignada exitosamente");
    });

    it("debería lanzar error cuando el usuario no es ADMIN", async () => {
      // Act & Assert
      await expect(
        assignTaskUseCase.assignTask(
          taskId,
          assignToUserId,
          currentUserId,
          "USER",
        ),
      ).rejects.toThrow("Solo los administradores pueden asignar tareas");
    });

    it("debería lanzar error cuando el taskId es inválido", async () => {
      // Act & Assert
      await expect(
        assignTaskUseCase.assignTask(
          "invalid-id",
          assignToUserId,
          currentUserId,
          "ADMIN",
        ),
      ).rejects.toThrow("ID de tarea inválido");
    });

    it("debería lanzar error cuando el assignToUserId es inválido", async () => {
      // Act & Assert
      await expect(
        assignTaskUseCase.assignTask(
          taskId,
          "invalid-user-id",
          currentUserId,
          "ADMIN",
        ),
      ).rejects.toThrow("Invalid user ID");
    });

    it("debería lanzar error cuando la tarea no existe", async () => {
      // Arrange
      mockTaskRepository.findTaskById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        assignTaskUseCase.assignTask(
          taskId,
          assignToUserId,
          currentUserId,
          "ADMIN",
        ),
      ).rejects.toThrow("Tarea no encontrada");
    });

    it("debería lanzar error cuando la tarea está completada", async () => {
      // Arrange
      const completedTask = new Task({
        ...mockTask.toJSON(),
        status: TaskStatus.COMPLETED,
      } as any);

      mockTaskRepository.findTaskById.mockResolvedValue(completedTask);

      // Act & Assert
      await expect(
        assignTaskUseCase.assignTask(
          taskId,
          assignToUserId,
          currentUserId,
          "ADMIN",
        ),
      ).rejects.toThrow("no puede ser asignada");
    });

    it("debería validar UUIDs correctamente", async () => {
      // UUIDs válidos
      const validUUIDs = [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      ];

      // UUIDs inválidos
      const invalidUUIDs = [
        "invalid-uuid",
        "123e4567-e89b-12d3-a456",
        "550e8400-e29b-41d4-a716-44665544000g",
      ];

      // Verificar que los UUIDs válidos pasen la validación
      for (const uuid of validUUIDs) {
        expect(assignTaskUseCase["isValidUUID"](uuid)).toBe(true);
      }

      // Verificar que los UUIDs inválidos fallen la validación
      for (const uuid of invalidUUIDs) {
        expect(assignTaskUseCase["isValidUUID"](uuid)).toBe(false);
      }
    });
  });
});
