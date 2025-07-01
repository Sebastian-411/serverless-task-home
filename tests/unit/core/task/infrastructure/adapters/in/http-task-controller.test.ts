/**
 * Tests for HttpTaskController
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { HttpTaskController } from "../../../../../../../core/task/infrastructure/adapters/in/http-task-controller";

// Mock dependencies
jest.mock("../../../../../../../core/task/application", () => ({
  GetTasksUseCase: jest.fn(),
  GetTaskByIdUseCase: jest.fn(),
  CreateTaskUseCase: jest.fn(),
  UpdateTaskUseCase: jest.fn(),
  DeleteTaskUseCase: jest.fn(),
  AssignTaskUseCase: jest.fn(),
  GetUserTasksUseCase: jest.fn(),
  GetTaskSummaryUseCase: jest.fn(),
}));

jest.mock(
  "../../../../../../../core/task/infrastructure/task.repository.prisma",
);
jest.mock("../../../../../../../lib/generated/prisma");
jest.mock(
  "../../../../../../../core/common/config/middlewares/auth.middleware",
);
jest.mock("../../../../../../../core/common/config/ai/gemini.service");

describe("HttpTaskController", () => {
  let controller: HttpTaskController;
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockGetTasksUseCase: any;
  let mockGetTaskByIdUseCase: any;
  let mockCreateTaskUseCase: any;
  let mockUpdateTaskUseCase: any;
  let mockDeleteTaskUseCase: any;
  let mockAssignTaskUseCase: any;
  let mockGetUserTasksUseCase: any;
  let mockGetTaskSummaryUseCase: any;
  let mockAuthenticate: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock response methods
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };

    // Mock request
    mockReq = {
      query: {},
      body: {},
      headers: {},
    };

    // Mock use cases
    mockGetTasksUseCase = {
      getTasks: jest.fn(),
    };
    mockGetTaskByIdUseCase = {
      getTaskById: jest.fn(),
    };
    mockCreateTaskUseCase = {
      createTask: jest.fn(),
    };
    mockUpdateTaskUseCase = {
      updateTask: jest.fn(),
    };
    mockDeleteTaskUseCase = {
      deleteTask: jest.fn(),
    };
    mockAssignTaskUseCase = {
      assignTask: jest.fn(),
    };
    mockGetUserTasksUseCase = {
      getUserTasks: jest.fn(),
    };
    mockGetTaskSummaryUseCase = {
      execute: jest.fn(),
    };

    // Mock authenticate function
    mockAuthenticate = jest.fn();
    const {
      authenticate,
    } = require("../../../../../../../core/common/config/middlewares/auth.middleware");
    authenticate.mockImplementation(mockAuthenticate);

    // Mock use case constructors
    const {
      GetTasksUseCase,
      GetTaskByIdUseCase,
      CreateTaskUseCase,
      UpdateTaskUseCase,
      DeleteTaskUseCase,
      AssignTaskUseCase,
      GetUserTasksUseCase,
      GetTaskSummaryUseCase,
    } = require("../../../../../../../core/task/application");
    GetTasksUseCase.mockImplementation(() => mockGetTasksUseCase);
    GetTaskByIdUseCase.mockImplementation(() => mockGetTaskByIdUseCase);
    CreateTaskUseCase.mockImplementation(() => mockCreateTaskUseCase);
    UpdateTaskUseCase.mockImplementation(() => mockUpdateTaskUseCase);
    DeleteTaskUseCase.mockImplementation(() => mockDeleteTaskUseCase);
    AssignTaskUseCase.mockImplementation(() => mockAssignTaskUseCase);
    GetUserTasksUseCase.mockImplementation(() => mockGetUserTasksUseCase);
    GetTaskSummaryUseCase.mockImplementation(() => mockGetTaskSummaryUseCase);

    controller = new HttpTaskController();
  });

  describe("Constructor", () => {
    it("should initialize all use cases", () => {
      expect(controller).toBeInstanceOf(HttpTaskController);
    });
  });

  describe("getTaskById", () => {
    const authContext = {
      isAuthenticated: true,
      user: { id: "user-1", role: "admin" },
    };

    beforeEach(() => {
      mockReq.query = { id: "task-1" };
      mockAuthenticate.mockResolvedValue(authContext);
    });

    it("should return task successfully", async () => {
      const task = { id: "task-1", title: "Test Task" };
      mockGetTaskByIdUseCase.getTaskById.mockResolvedValue(task);

      await controller.getTaskById(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockAuthenticate).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockGetTaskByIdUseCase.getTaskById).toHaveBeenCalledWith(
        "task-1",
        "user-1",
        "ADMIN",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: task });
    });

    it("should return 401 when not authenticated", async () => {
      mockAuthenticate.mockResolvedValue({ isAuthenticated: false });

      await controller.getTaskById(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should return 404 when task not found", async () => {
      mockGetTaskByIdUseCase.getTaskById.mockResolvedValue(null);

      await controller.getTaskById(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Task not found" });
    });

    it("should return 403 when authorization fails", async () => {
      mockGetTaskByIdUseCase.getTaskById.mockRejectedValue(
        new Error("You don't have permission"),
      );

      await controller.getTaskById(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "You don't have permission",
      });
    });

    it("should return 500 on internal error", async () => {
      mockGetTaskByIdUseCase.getTaskById.mockRejectedValue(
        new Error("Database error"),
      );

      await controller.getTaskById(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("getTasks", () => {
    const authContext = {
      isAuthenticated: true,
      user: { id: "user-1", role: "admin" },
    };

    beforeEach(() => {
      mockAuthenticate.mockResolvedValue(authContext);
    });

    it("should return tasks successfully", async () => {
      const result = {
        tasks: [{ id: "task-1", title: "Test Task" }],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockGetTasksUseCase.getTasks.mockResolvedValue(result);

      await controller.getTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockGetTasksUseCase.getTasks).toHaveBeenCalledWith(
        {},
        "user-1",
        "ADMIN",
        1,
        10,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: result.tasks,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it("should apply filters correctly", async () => {
      mockReq.query = {
        status: "PENDING",
        priority: "HIGH",
        page: "2",
        limit: "5",
      };

      const result = {
        tasks: [],
        total: 0,
        page: 2,
        limit: 5,
      };
      mockGetTasksUseCase.getTasks.mockResolvedValue(result);

      await controller.getTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockGetTasksUseCase.getTasks).toHaveBeenCalledWith(
        {
          status: "PENDING",
          priority: "HIGH",
        },
        "user-1",
        "ADMIN",
        2,
        5,
      );
    });

    it("should return 401 when not authenticated", async () => {
      mockAuthenticate.mockResolvedValue({ isAuthenticated: false });

      await controller.getTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should return 403 when authorization fails", async () => {
      mockGetTasksUseCase.getTasks.mockRejectedValue(
        new Error("You don't have permission"),
      );

      await controller.getTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "You don't have permission",
      });
    });

    it("should return 500 on validation error", async () => {
      mockGetTasksUseCase.getTasks.mockRejectedValue(
        new Error("Invalid status"),
      );

      await controller.getTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("createTask", () => {
    const authContext = {
      isAuthenticated: true,
      user: { id: "user-1", role: "admin" },
    };

    beforeEach(() => {
      mockAuthenticate.mockResolvedValue(authContext);
      mockReq.body = {
        title: "New Task",
        description: "Task description",
      };
    });

    it("should create task successfully", async () => {
      const task = { id: "task-1", title: "New Task" };
      mockCreateTaskUseCase.createTask.mockResolvedValue(task);

      await controller.createTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockCreateTaskUseCase.createTask).toHaveBeenCalledWith(
        {
          title: "New Task",
          description: "Task description",
          status: undefined,
          priority: undefined,
          dueDate: undefined,
          assignedTo: undefined,
          createdBy: "user-1",
        },
        "ADMIN",
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ data: task });
    });

    it("should handle due date conversion", async () => {
      mockReq.body = {
        title: "New Task",
        description: "Task description",
        dueDate: "2025-01-01T00:00:00.000Z",
      };

      const task = { id: "task-1", title: "New Task" };
      mockCreateTaskUseCase.createTask.mockResolvedValue(task);

      await controller.createTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockCreateTaskUseCase.createTask).toHaveBeenCalledWith(
        {
          title: "New Task",
          description: "Task description",
          status: undefined,
          priority: undefined,
          dueDate: new Date("2025-01-01T00:00:00.000Z"),
          assignedTo: undefined,
          createdBy: "user-1",
        },
        "ADMIN",
      );
    });

    it("should return 401 when not authenticated", async () => {
      mockAuthenticate.mockResolvedValue({ isAuthenticated: false });

      await controller.createTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should return 500 on validation error", async () => {
      mockCreateTaskUseCase.createTask.mockRejectedValue(
        new Error("Required fields are missing"),
      );

      await controller.createTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("updateTask", () => {
    const authContext = {
      isAuthenticated: true,
      user: { id: "user-1", role: "admin" },
    };

    beforeEach(() => {
      mockReq.query = { id: "task-1" };
      mockReq.body = { title: "Updated Task" };
      mockAuthenticate.mockResolvedValue(authContext);
    });

    it("should update task successfully", async () => {
      const task = { id: "task-1", title: "Updated Task" };
      mockUpdateTaskUseCase.updateTask.mockResolvedValue(task);

      await controller.updateTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockUpdateTaskUseCase.updateTask).toHaveBeenCalledWith(
        "task-1",
        { title: "Updated Task" },
        "user-1",
        "ADMIN",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data: task });
    });

    it("should return 401 when not authenticated", async () => {
      mockAuthenticate.mockResolvedValue({ isAuthenticated: false });

      await controller.updateTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should return 403 when authorization fails", async () => {
      mockUpdateTaskUseCase.updateTask.mockRejectedValue(
        new Error("You don't have permission"),
      );

      await controller.updateTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "You don't have permission",
      });
    });

    it("should return 404 when task not found", async () => {
      mockUpdateTaskUseCase.updateTask.mockRejectedValue(
        new Error("Task not found"),
      );

      await controller.updateTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Task not found" });
    });
  });

  describe("deleteTask", () => {
    const authContext = {
      isAuthenticated: true,
      user: { id: "user-1", role: "admin" },
    };

    beforeEach(() => {
      mockReq.query = { id: "task-1" };
      mockAuthenticate.mockResolvedValue(authContext);
    });

    it("should delete task successfully", async () => {
      mockDeleteTaskUseCase.deleteTask.mockResolvedValue(undefined);

      await controller.deleteTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockDeleteTaskUseCase.deleteTask).toHaveBeenCalledWith(
        "task-1",
        "user-1",
        "ADMIN",
      );
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      mockAuthenticate.mockResolvedValue({ isAuthenticated: false });

      await controller.deleteTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should return 403 when authorization fails", async () => {
      mockDeleteTaskUseCase.deleteTask.mockRejectedValue(
        new Error("You don't have permission"),
      );

      await controller.deleteTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "You don't have permission",
      });
    });

    it("should return 404 when task not found", async () => {
      mockDeleteTaskUseCase.deleteTask.mockRejectedValue(
        new Error("Task not found"),
      );

      await controller.deleteTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Task not found" });
    });
  });

  describe("assignTask", () => {
    const authContext = {
      isAuthenticated: true,
      user: { id: "user-1", role: "admin" },
    };

    beforeEach(() => {
      mockReq.query = { id: "task-1" };
      mockReq.body = { userId: "user-2" };
      mockAuthenticate.mockResolvedValue(authContext);
    });

    it("should assign task successfully", async () => {
      const result = {
        task: { id: "task-1", assignedTo: "user-2" },
        message: "Task assigned successfully",
      };
      mockAssignTaskUseCase.assignTask.mockResolvedValue(result);

      await controller.assignTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockAssignTaskUseCase.assignTask).toHaveBeenCalledWith(
        "task-1",
        "user-2",
        "user-1",
        "ADMIN",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: result.task,
        message: result.message,
      });
    });

    it("should return 401 when not authenticated", async () => {
      mockAuthenticate.mockResolvedValue({ isAuthenticated: false });

      await controller.assignTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should return 400 when userId is missing", async () => {
      mockReq.body = {};

      await controller.assignTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "The userId field is required",
      });
    });

    it("should return 403 when authorization fails", async () => {
      mockAssignTaskUseCase.assignTask.mockRejectedValue(
        new Error("Only administrators can assign tasks"),
      );

      await controller.assignTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Only administrators can assign tasks",
      });
    });

    it("should return 404 when task not found", async () => {
      mockAssignTaskUseCase.assignTask.mockRejectedValue(
        new Error("Task not found"),
      );

      await controller.assignTask(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Task not found" });
    });
  });

  describe("getUserTasks", () => {
    const authContext = {
      isAuthenticated: true,
      user: { id: "user-1", role: "admin" },
    };

    beforeEach(() => {
      mockReq.query = { id: "user-2" };
      mockAuthenticate.mockResolvedValue(authContext);
    });

    it("should return user tasks successfully", async () => {
      const result = {
        tasks: [{ id: "task-1", title: "User Task" }],
        userId: "user-2",
        total: 1,
        page: 1,
        limit: 10,
      };
      mockGetUserTasksUseCase.getUserTasks.mockResolvedValue(result);

      await controller.getUserTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockGetUserTasksUseCase.getUserTasks).toHaveBeenCalledWith(
        {
          userId: "user-2",
          filters: {},
          page: 1,
          limit: 10,
        },
        "user-1",
        "ADMIN",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: result.tasks,
        userId: result.userId,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it("should return 401 when not authenticated", async () => {
      mockAuthenticate.mockResolvedValue({ isAuthenticated: false });

      await controller.getUserTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should return 403 when authorization fails", async () => {
      mockGetUserTasksUseCase.getUserTasks.mockRejectedValue(
        new Error("You don't have permission"),
      );

      await controller.getUserTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "You don't have permission",
      });
    });

    it("should return 400 on validation error", async () => {
      mockGetUserTasksUseCase.getUserTasks.mockRejectedValue(
        new Error("Invalid user ID"),
      );

      await controller.getUserTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid user ID" });
    });

    it("should return 404 when user not found", async () => {
      mockGetUserTasksUseCase.getUserTasks.mockRejectedValue(
        new Error("User not found"),
      );

      await controller.getUserTasks(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("getTaskSummary", () => {
    const authContext = {
      isAuthenticated: true,
      user: { id: "user-1", role: "admin" },
    };

    beforeEach(() => {
      mockAuthenticate.mockResolvedValue(authContext);
    });

    it("should return task summary successfully", async () => {
      const result = {
        summary: "Task summary text",
        taskCount: 5,
        userRole: "admin",
      };
      mockGetTaskSummaryUseCase.execute.mockResolvedValue(result);

      await controller.getTaskSummary(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockGetTaskSummaryUseCase.execute).toHaveBeenCalledWith({
        limit: 10,
        authContext: { userId: "user-1", role: "admin" },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        summary: result.summary,
        taskCount: result.taskCount,
        userRole: result.userRole,
        limit: 10,
      });
    });

    it("should handle custom limit parameter", async () => {
      mockReq.query = { limit: "20" };
      const result = {
        summary: "Task summary text",
        taskCount: 5,
        userRole: "admin",
      };
      mockGetTaskSummaryUseCase.execute.mockResolvedValue(result);

      await controller.getTaskSummary(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockGetTaskSummaryUseCase.execute).toHaveBeenCalledWith({
        limit: 20,
        authContext: { userId: "user-1", role: "admin" },
      });
    });

    it("should return 401 when not authenticated", async () => {
      mockAuthenticate.mockResolvedValue({ isAuthenticated: false });

      await controller.getTaskSummary(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Authentication required",
      });
    });

    it("should return 400 when limit is invalid", async () => {
      mockReq.query = { limit: "invalid" };

      await controller.getTaskSummary(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Limit must be a number between 1 and 50",
      });
    });

    it("should return 400 when limit is out of range", async () => {
      mockReq.query = { limit: "100" };

      await controller.getTaskSummary(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Limit must be a number between 1 and 50",
      });
    });

    it("should return 500 on AI service error", async () => {
      mockGetTaskSummaryUseCase.execute.mockRejectedValue(
        new Error("GEMINI_API_KEY not found"),
      );

      await controller.getTaskSummary(
        mockReq as VercelRequest,
        mockRes as VercelResponse,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "AI service configuration error",
      });
    });
  });
});
