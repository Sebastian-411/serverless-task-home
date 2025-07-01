import type { GetTaskSummaryCommand } from "../../../../../core/task/application/get-task-summary.usecase";
import { GetTaskSummaryUseCase } from "../../../../../core/task/application/get-task-summary.usecase";
import { Task } from "../../../../../core/task/domain/entities/task.entity";
import { TaskStatus, TaskPriority } from "../../../../../core/task/domain";

// Mock GeminiService
const mockGeminiService = {
  generateTaskSummary: jest.fn(),
};

// Mock TaskRepository
const mockTaskRepository = {
  findRecentTasks: jest.fn(),
  findRecentTasksByUser: jest.fn(),
};

describe("GetTaskSummaryUseCase", () => {
  let getTaskSummaryUseCase: GetTaskSummaryUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    getTaskSummaryUseCase = new GetTaskSummaryUseCase(
      mockTaskRepository as any,
      mockGeminiService as any,
    );
  });

  describe("execute", () => {
    const mockTasks: Task[] = [
      new Task({
        id: "task-1",
        title: "Implement login flow",
        description: "Create user authentication system",
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        createdBy: "user-1",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }),
      new Task({
        id: "task-2",
        title: "Update UI components",
        description: "Improve user interface design",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        createdBy: "user-2",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }),
    ];

    it("should generate summary for admin user with all recent tasks", async () => {
      // Arrange
      const command: GetTaskSummaryCommand = {
        limit: 10,
        authContext: { userId: "admin-1", role: "admin" },
      };

      mockTaskRepository.findRecentTasks.mockResolvedValue(mockTasks);
      mockGeminiService.generateTaskSummary.mockResolvedValue(
        "Recent tasks include implementing login flow and updating UI components.",
      );

      // Act
      const result = await getTaskSummaryUseCase.execute(command);

      // Assert
      expect(mockTaskRepository.findRecentTasks).toHaveBeenCalledWith(10);
      expect(mockGeminiService.generateTaskSummary).toHaveBeenCalledWith(
        [
          {
            title: "Implement login flow",
            description: "Create user authentication system",
          },
          {
            title: "Update UI components",
            description: "Improve user interface design",
          },
        ],
        "admin",
      );
      expect(result).toEqual({
        summary:
          "Recent tasks include implementing login flow and updating UI components.",
        taskCount: 2,
        userRole: "admin",
      });
    });

    it("should generate summary for regular user with assigned tasks only", async () => {
      // Arrange
      const command: GetTaskSummaryCommand = {
        limit: 5,
        authContext: { userId: "user-1", role: "user" },
      };

      const userTasks = [mockTasks[0]]; // Only the first task assigned to user-1
      mockTaskRepository.findRecentTasksByUser.mockResolvedValue(userTasks);
      mockGeminiService.generateTaskSummary.mockResolvedValue(
        "You have one task related to implementing login flow.",
      );

      // Act
      const result = await getTaskSummaryUseCase.execute(command);

      // Assert
      expect(mockTaskRepository.findRecentTasksByUser).toHaveBeenCalledWith(
        "user-1",
        5,
      );
      expect(mockGeminiService.generateTaskSummary).toHaveBeenCalledWith(
        [
          {
            title: "Implement login flow",
            description: "Create user authentication system",
          },
        ],
        "user",
      );
      expect(result).toEqual({
        summary: "You have one task related to implementing login flow.",
        taskCount: 1,
        userRole: "user",
      });
    });

    it("should clamp limit between 1 and 50", async () => {
      // Arrange
      const command: GetTaskSummaryCommand = {
        limit: 100, // Exceeds maximum
        authContext: { userId: "admin-1", role: "admin" },
      };

      mockTaskRepository.findRecentTasks.mockResolvedValue(mockTasks);
      mockGeminiService.generateTaskSummary.mockResolvedValue("Summary");

      // Act
      await getTaskSummaryUseCase.execute(command);

      // Assert
      expect(mockTaskRepository.findRecentTasks).toHaveBeenCalledWith(50);
    });

    it("should handle empty task list", async () => {
      // Arrange
      const command: GetTaskSummaryCommand = {
        limit: 10,
        authContext: { userId: "user-1", role: "user" },
      };

      mockTaskRepository.findRecentTasksByUser.mockResolvedValue([]);
      mockGeminiService.generateTaskSummary.mockResolvedValue(
        "You have no recent tasks assigned to you.",
      );

      // Act
      const result = await getTaskSummaryUseCase.execute(command);

      // Assert
      expect(result.taskCount).toBe(0);
      expect(mockGeminiService.generateTaskSummary).toHaveBeenCalledWith(
        [],
        "user",
      );
    });

    it("should throw error when authentication is missing", async () => {
      // Arrange
      const command: GetTaskSummaryCommand = {
        limit: 10,
        authContext: { userId: "", role: "user" },
      };

      // Act & Assert
      await expect(getTaskSummaryUseCase.execute(command)).rejects.toThrow(
        "Authentication required",
      );
    });

    it("should handle tasks with missing descriptions", async () => {
      // Arrange
      const tasksWithMissingDesc = [
        new Task({
          id: "task-1",
          title: "Task without description",
          description: undefined,
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          createdBy: "user-1",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }),
      ];

      const command: GetTaskSummaryCommand = {
        limit: 10,
        authContext: { userId: "admin-1", role: "admin" },
      };

      mockTaskRepository.findRecentTasks.mockResolvedValue(
        tasksWithMissingDesc,
      );
      mockGeminiService.generateTaskSummary.mockResolvedValue("Summary");

      // Act
      await getTaskSummaryUseCase.execute(command);

      // Assert
      expect(mockGeminiService.generateTaskSummary).toHaveBeenCalledWith(
        [
          {
            title: "Task without description",
            description: "No description provided",
          },
        ],
        "admin",
      );
    });

    it("should handle repository errors", async () => {
      // Arrange
      const command: GetTaskSummaryCommand = {
        limit: 10,
        authContext: { userId: "admin-1", role: "admin" },
      };

      mockTaskRepository.findRecentTasks.mockRejectedValue(
        new Error("Database error"),
      );

      // Act & Assert
      await expect(getTaskSummaryUseCase.execute(command)).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle Gemini service errors", async () => {
      // Arrange
      const command: GetTaskSummaryCommand = {
        limit: 10,
        authContext: { userId: "admin-1", role: "admin" },
      };

      mockTaskRepository.findRecentTasks.mockResolvedValue(mockTasks);
      mockGeminiService.generateTaskSummary.mockRejectedValue(
        new Error("AI service error"),
      );

      // Act & Assert
      await expect(getTaskSummaryUseCase.execute(command)).rejects.toThrow(
        "AI service error",
      );
    });
  });
});
