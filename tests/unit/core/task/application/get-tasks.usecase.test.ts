import type { TaskRepositoryPort } from "../../../../../core/task/application";
import { GetTasksUseCase } from "../../../../../core/task/application";
import {
  Task,
  TaskStatus,
  TaskPriority,
} from "../../../../../core/task/domain";
import type { GetTasksFilters } from "../../../../../core/task/domain/ports/in/task-controller.port";
import { GetTasksResult } from "../../../../../core/task/domain/ports/in/task-controller.port";

describe("GetTasksUseCase", () => {
  let mockTaskRepository: jest.Mocked<TaskRepositoryPort>;
  let getTasksUseCase: GetTasksUseCase;

  const mockTask = new Task({
    id: "task-123",
    title: "Test Task",
    description: "Test Description",
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: "2024-12-31T00:00:00.000Z",
    assignedTo: "user-123",
    createdBy: "creator-456",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });

  beforeEach(() => {
    mockTaskRepository = {
      findTasks: jest.fn(),
      findTaskById: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      findRecentTasks: jest.fn(),
      findRecentTasksByUser: jest.fn(),
    };
    getTasksUseCase = new GetTasksUseCase(mockTaskRepository);
  });

  describe("getTasks", () => {
    const defaultFilters: GetTasksFilters = {};
    const userId = "user-123";
    const userRole = "USER";

    it("should return tasks with default pagination", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      const result = await getTasksUseCase.getTasks(
        defaultFilters,
        userId,
        userRole,
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.any(Object),
        userId,
        userRole,
        1,
        10,
      );

      expect(result).toEqual({
        tasks: [mockTask.toJSON()],
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it("should handle custom pagination parameters", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      const result = await getTasksUseCase.getTasks(
        defaultFilters,
        userId,
        userRole,
        2,
        5,
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.any(Object),
        userId,
        userRole,
        2,
        5,
      );

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it("should normalize page number to minimum 1", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(defaultFilters, userId, userRole, 0, 10);

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.any(Object),
        userId,
        userRole,
        1,
        10,
      );
    });

    it("should normalize limit to maximum 100", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(defaultFilters, userId, userRole, 1, 150);

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.any(Object),
        userId,
        userRole,
        1,
        100,
      );
    });

    it("should normalize limit to minimum 1", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(defaultFilters, userId, userRole, 1, 0);

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.any(Object),
        userId,
        userRole,
        1,
        10,
      );
    });
  });

  describe("Authorization filters", () => {
    it("should allow admin to see all tasks", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks({}, "admin-123", "ADMIN");

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.objectContaining({}),
        "admin-123",
        "ADMIN",
        1,
        10,
      );
    });

    it("should restrict user to see only assigned and created tasks", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks({}, "user-123", "USER");

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.objectContaining({}),
        "user-123",
        "USER",
        1,
        10,
      );
    });

    it("should allow user to filter by their own assigned tasks", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(
        { assignedTo: "user-123" },
        "user-123",
        "USER",
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.objectContaining({ assignedTo: "user-123" }),
        "user-123",
        "USER",
        1,
        10,
      );
    });

    it("should allow user to filter by their own created tasks", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(
        { createdBy: "user-123" },
        "user-123",
        "USER",
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: "user-123" }),
        "user-123",
        "USER",
        1,
        10,
      );
    });

    it("should throw error when user tries to see tasks assigned to others", async () => {
      // No need to mock repository since authorization should fail before reaching it
      mockTaskRepository.findTasks.mockResolvedValue({
        tasks: [mockTask],
        total: 1,
      });

      await expect(
        getTasksUseCase.getTasks(
          { assignedTo: "123e4567-e89b-12d3-a456-426614174000" },
          "user-123",
          "USER",
        ),
      ).rejects.toThrow(
        "No tienes permisos para ver tareas asignadas a otros usuarios",
      );
    });

    it("should throw error when user tries to see tasks created by others", async () => {
      // No need to mock repository since authorization should fail before reaching it
      mockTaskRepository.findTasks.mockResolvedValue({
        tasks: [mockTask],
        total: 1,
      });

      await expect(
        getTasksUseCase.getTasks(
          { createdBy: "123e4567-e89b-12d3-a456-426614174000" },
          "user-123",
          "USER",
        ),
      ).rejects.toThrow(
        "No tienes permisos para ver tareas creadas por otros usuarios",
      );
    });

    it("should allow admin to filter by any user", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(
        {
          assignedTo: "123e4567-e89b-12d3-a456-426614174000",
          createdBy: "987fcdeb-51a2-43d1-b789-123456789abc",
        },
        "admin-123",
        "ADMIN",
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedTo: "123e4567-e89b-12d3-a456-426614174000",
          createdBy: "987fcdeb-51a2-43d1-b789-123456789abc",
        }),
        "admin-123",
        "ADMIN",
        1,
        10,
      );
    });
  });

  describe("Filter validation", () => {
    it("should validate and accept valid status", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks({ status: "PENDING" }, "user-123", "USER");

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "PENDING",
        }),
        "user-123",
        "USER",
        1,
        10,
      );
    });

    it("should ignore invalid status", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(
        { status: "INVALID_STATUS" },
        "user-123",
        "USER",
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.not.objectContaining({
          status: "INVALID_STATUS",
        }),
        "user-123",
        "USER",
        1,
        10,
      );
    });

    it("should validate and accept valid priority", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks({ priority: "HIGH" }, "user-123", "USER");

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: "HIGH",
        }),
        "user-123",
        "USER",
        1,
        10,
      );
    });

    it("should validate UUID for assignedTo", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(
        { assignedTo: "user-123" },
        "user-123",
        "USER",
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedTo: "user-123",
        }),
        "user-123",
        "USER",
        1,
        10,
      );
    });

    it("should ignore invalid UUID for assignedTo", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(
        { assignedTo: "invalid-uuid" },
        "user-123",
        "USER",
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.not.objectContaining({
          assignedTo: "invalid-uuid",
        }),
        "user-123",
        "USER",
        1,
        10,
      );
    });

    it("should validate date formats", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      const validDate = new Date("2024-01-01");

      await getTasksUseCase.getTasks(
        {
          dueDateFrom: validDate,
          dueDateTo: validDate,
        },
        "user-123",
        "USER",
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDateFrom: validDate,
          dueDateTo: validDate,
        }),
        "user-123",
        "USER",
        1,
        10,
      );
    });

    it("should ignore invalid date formats", async () => {
      const mockResult = {
        tasks: [mockTask],
        total: 1,
      };

      mockTaskRepository.findTasks.mockResolvedValue(mockResult);

      await getTasksUseCase.getTasks(
        {
          dueDateFrom: new Date("invalid-date"),
          dueDateTo: new Date("invalid-date"),
        },
        "user-123",
        "USER",
      );

      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(
        expect.not.objectContaining({
          dueDateFrom: expect.any(Date),
          dueDateTo: expect.any(Date),
        }),
        "user-123",
        "USER",
        1,
        10,
      );
    });
  });

  describe("Error handling", () => {
    it("should propagate repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      mockTaskRepository.findTasks.mockRejectedValue(repositoryError);

      await expect(
        getTasksUseCase.getTasks({}, "user-123", "USER"),
      ).rejects.toThrow("Database connection failed");
    });
  });
});
