import { GetUserTasksUseCase } from "../../../../../core/task/application/get-user-tasks.usecase";
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

describe("GetUserTasksUseCase", () => {
  let getUserTasksUseCase: GetUserTasksUseCase;
  let mockTasks: Task[];

  beforeEach(() => {
    getUserTasksUseCase = new GetUserTasksUseCase(mockTaskRepository);

    // Crear tareas mock
    mockTasks = [
      new Task({
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Tarea 1",
        description: "Descripción de la tarea 1",
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueDate: "2024-12-31",
        assignedTo: "123e4567-e89b-12d3-a456-426614174000",
        createdBy: "123e4567-e89b-12d3-a456-426614174000",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
      new Task({
        id: "123e4567-e89b-12d3-a456-426614174001",
        title: "Tarea 2",
        description: "Descripción de la tarea 2",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: "2024-12-30",
        assignedTo: "123e4567-e89b-12d3-a456-426614174000",
        createdBy: "456e4567-e89b-12d3-a456-426614174001",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
    ];

    jest.clearAllMocks();
  });

  describe("getUserTasks", () => {
    it("debería obtener tareas de un usuario cuando es ADMIN", async () => {
      // Arrange
      const request = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        page: 1,
        limit: 10,
      };
      const currentUserId = "456e4567-e89b-12d3-a456-426614174001";
      const currentUserRole = "ADMIN";

      mockTaskRepository.findTasks.mockResolvedValue({
        tasks: mockTasks,
        total: 2,
      });

      // Act
      const result = await getUserTasksUseCase.getUserTasks(
        request,
        currentUserId,
        currentUserRole,
      );

      // Assert
      expect(result.tasks).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.userId).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        {},
        currentUserId,
        currentUserRole,
        1,
        10,
      );
    });

    it("debería obtener tareas propias cuando es USER", async () => {
      // Arrange
      const request = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        page: 1,
        limit: 10,
      };
      const currentUserId = "123e4567-e89b-12d3-a456-426614174000";
      const currentUserRole = "USER";

      mockTaskRepository.findTasks.mockResolvedValue({
        tasks: mockTasks,
        total: 2,
      });

      // Act
      const result = await getUserTasksUseCase.getUserTasks(
        request,
        currentUserId,
        currentUserRole,
      );

      // Assert
      expect(result.tasks).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.userId).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        {},
        currentUserId,
        currentUserRole,
        1,
        10,
      );
    });

    it("debería lanzar error cuando USER intenta ver tareas de otro usuario", async () => {
      // Arrange
      const request = {
        userId: "789e4567-e89b-12d3-a456-426614174002",
        page: 1,
        limit: 10,
      };
      const currentUserId = "123e4567-e89b-12d3-a456-426614174000";
      const currentUserRole = "USER";

      // Act & Assert
      await expect(
        getUserTasksUseCase.getUserTasks(
          request,
          currentUserId,
          currentUserRole,
        ),
      ).rejects.toThrow("No tienes permisos para ver tareas de otros usuarios");
    });

    it("debería lanzar error cuando el userId no es un UUID válido", async () => {
      // Arrange
      const request = {
        userId: "invalid-uuid",
        page: 1,
        limit: 10,
      };
      const currentUserId = "456e4567-e89b-12d3-a456-426614174001";
      const currentUserRole = "ADMIN";

      // Act & Assert
      await expect(
        getUserTasksUseCase.getUserTasks(
          request,
          currentUserId,
          currentUserRole,
        ),
      ).rejects.toThrow("Invalid user ID");
    });

    it("debería aplicar filtros correctamente", async () => {
      // Arrange
      const request = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        filters: {
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
        },
        page: 1,
        limit: 10,
      };
      const currentUserId = "456e4567-e89b-12d3-a456-426614174001";
      const currentUserRole = "ADMIN";

      mockTaskRepository.findTasks.mockResolvedValue({
        tasks: [mockTasks[0]],
        total: 1,
      });

      // Act
      const result = await getUserTasksUseCase.getUserTasks(
        request,
        currentUserId,
        currentUserRole,
      );

      // Assert
      expect(result.tasks).toHaveLength(1);
      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        {
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
        },
        currentUserId,
        currentUserRole,
        1,
        10,
      );
    });

    it("debería normalizar parámetros de paginación", async () => {
      // Arrange
      const request = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        page: 0, // Debería normalizarse a 1
        limit: 150, // Debería normalizarse a 100
      };
      const currentUserId = "456e4567-e89b-12d3-a456-426614174001";
      const currentUserRole = "ADMIN";

      mockTaskRepository.findTasks.mockResolvedValue({
        tasks: mockTasks,
        total: 2,
      });

      // Act
      const result = await getUserTasksUseCase.getUserTasks(
        request,
        currentUserId,
        currentUserRole,
      );

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(100);
      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        {},
        currentUserId,
        currentUserRole,
        1,
        100,
      );
    });

    it("debería lanzar error cuando USER intenta filtrar por otros usuarios", async () => {
      // Arrange
      const request = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        filters: {
          assignedTo: "789e4567-e89b-12d3-a456-426614174002",
        },
        page: 1,
        limit: 10,
      };
      const currentUserId = "123e4567-e89b-12d3-a456-426614174000";
      const currentUserRole = "USER";

      // Act & Assert
      await expect(
        getUserTasksUseCase.getUserTasks(
          request,
          currentUserId,
          currentUserRole,
        ),
      ).rejects.toThrow(
        "No tienes permisos para ver tareas asignadas a otros usuarios",
      );
    });

    it("debería lanzar error cuando el repositorio falla", async () => {
      // Arrange
      const request = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        page: 1,
        limit: 10,
      };
      const currentUserId = "456e4567-e89b-12d3-a456-426614174001";
      const currentUserRole = "ADMIN";

      mockTaskRepository.findTasks.mockResolvedValue(null);

      // Act & Assert
      await expect(
        getUserTasksUseCase.getUserTasks(
          request,
          currentUserId,
          currentUserRole,
        ),
      ).rejects.toThrow("Error retrieving tasks from repository");
    });
  });
});
