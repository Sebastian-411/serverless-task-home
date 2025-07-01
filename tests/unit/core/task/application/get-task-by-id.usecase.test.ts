import { GetTaskByIdUseCase } from "../../../../../core/task/application";
import {
  Task,
  TaskStatus,
  TaskPriority,
} from "../../../../../core/task/domain";

describe("GetTaskByIdUseCase", () => {
  let mockTaskRepository: any;
  let getTaskByIdUseCase: GetTaskByIdUseCase;

  const mockTask = new Task({
    id: "task-123",
    title: "Test Task",
    description: "Test Description",
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    assignedTo: "user-123",
    createdBy: "admin-456",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });

  beforeEach(() => {
    mockTaskRepository = {
      findTaskById: jest.fn(),
    };
    getTaskByIdUseCase = new GetTaskByIdUseCase(mockTaskRepository);
  });

  describe("getTaskById", () => {
    it("should return task when admin requests any task", async () => {
      // Arrange
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);

      // Act
      const result = await getTaskByIdUseCase.getTaskById(
        "task-123",
        "admin-456",
        "ADMIN",
      );

      // Assert
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith("task-123");
      expect(result).toEqual(mockTask.toJSON());
    });

    it("should return task when user requests assigned task", async () => {
      // Arrange
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);

      // Act
      const result = await getTaskByIdUseCase.getTaskById(
        "task-123",
        "user-123",
        "USER",
      );

      // Assert
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith("task-123");
      expect(result).toEqual(mockTask.toJSON());
    });

    it("should throw error when user requests non-assigned task", async () => {
      // Arrange
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);

      // Act & Assert
      await expect(
        getTaskByIdUseCase.getTaskById("task-123", "other-user-789", "USER"),
      ).rejects.toThrow("You don't have permission to view this task");
    });

    it("should return null when task does not exist", async () => {
      // Arrange
      mockTaskRepository.findTaskById.mockResolvedValue(null);

      // Act
      const result = await getTaskByIdUseCase.getTaskById(
        "non-existent-task",
        "admin-456",
        "ADMIN",
      );

      // Assert
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith(
        "non-existent-task",
      );
      expect(result).toBeNull();
    });

    it("should allow admin to see task assigned to any user", async () => {
      // Arrange
      const taskAssignedToOther = new Task({
        id: "task-456",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        assignedTo: "other-user-789",
        createdBy: "admin-456",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
      mockTaskRepository.findTaskById.mockResolvedValue(taskAssignedToOther);

      // Act
      const result = await getTaskByIdUseCase.getTaskById(
        "task-456",
        "admin-456",
        "ADMIN",
      );

      // Assert
      expect(result).toEqual(taskAssignedToOther.toJSON());
    });

    it("should allow admin to see task with no assignment", async () => {
      // Arrange
      const unassignedTask = new Task({
        id: "task-789",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        assignedTo: undefined,
        createdBy: "admin-456",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
      mockTaskRepository.findTaskById.mockResolvedValue(unassignedTask);

      // Act
      const result = await getTaskByIdUseCase.getTaskById(
        "task-789",
        "admin-456",
        "ADMIN",
      );

      // Assert
      expect(result).toEqual(unassignedTask.toJSON());
    });
  });
});
