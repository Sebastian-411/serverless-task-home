import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  GetTasksUseCase,
  GetTaskByIdUseCase,
  CreateTaskUseCase,
  UpdateTaskUseCase,
  DeleteTaskUseCase,
  AssignTaskUseCase,
  GetUserTasksUseCase,
  GetTaskSummaryUseCase,
} from "../../../application";
import type { GetTasksFilters } from "../../../domain/ports/in/task-controller.port";
import { TaskRepositoryPrisma } from "../../../infrastructure/task.repository.prisma";
import { PrismaClient } from "../../../../../lib/generated/prisma";
import { authenticate } from "../../../../common/config/middlewares/auth.middleware";
import { GeminiService } from "../../../../common/config/ai/gemini.service";

/**
 * HTTP controller for task-related operations.
 * Handles all HTTP requests for task management including CRUD operations,
 * task assignment, and user-specific task queries.
 */
export class HttpTaskController {
  private getTasksUseCase: GetTasksUseCase;
  private getTaskByIdUseCase: GetTaskByIdUseCase;
  private createTaskUseCase: CreateTaskUseCase;
  private updateTaskUseCase: UpdateTaskUseCase;
  private deleteTaskUseCase: DeleteTaskUseCase;
  private assignTaskUseCase: AssignTaskUseCase;
  private getUserTasksUseCase: GetUserTasksUseCase;
  private getTaskSummaryUseCase: GetTaskSummaryUseCase;

  /**
   * Initializes the HTTP task controller with all required use cases.
   * Creates Prisma client and task repository instances.
   */
  constructor() {
    console.log("HttpTaskController.constructor called", {
      method: "constructor",
      component: "HttpTaskController",
    });

    const prisma = new PrismaClient();
    const taskRepository = new TaskRepositoryPrisma(prisma);
    this.getTasksUseCase = new GetTasksUseCase(taskRepository);
    this.getTaskByIdUseCase = new GetTaskByIdUseCase(taskRepository);
    this.createTaskUseCase = new CreateTaskUseCase(taskRepository);
    this.updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
    this.deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
    this.assignTaskUseCase = new AssignTaskUseCase(taskRepository);
    this.getUserTasksUseCase = new GetUserTasksUseCase(taskRepository);
    this.getTaskSummaryUseCase = new GetTaskSummaryUseCase(
      taskRepository,
      new GeminiService(),
    );

    console.log("HttpTaskController.constructor completed", {
      method: "constructor",
      component: "HttpTaskController",
      useCasesInitialized: 8,
    });
  }

  /**
   * Handles GET request to retrieve a specific task by ID.
   *
   * @param req - Vercel request object containing task ID in query parameters
   * @param res - Vercel response object
   * @returns Promise that resolves when the response is sent
   * @throws May throw authentication, authorization, or database errors
   */
  async getTaskById(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const taskId = req.query.id as string;

    console.log("HttpTaskController.getTaskById called", {
      method: "getTaskById",
      requestId,
      taskId,
      endpoint: "GET /tasks/:id",
    });

    try {
      // Get authenticated user information from middleware
      console.log("HttpTaskController.getTaskById - Authenticating user", {
        method: "getTaskById",
        requestId,
      });
      const authContext = await authenticate(req, res);

      // Verify authentication
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn(
          "HttpTaskController.getTaskById - User not authenticated",
          {
            method: "getTaskById",
            requestId,
          },
        );
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      console.log("HttpTaskController.getTaskById - User authenticated", {
        method: "getTaskById",
        requestId,
        userId: authContext.user.id,
        userRole: authContext.user.role,
      });

      // Execute use case
      console.log("HttpTaskController.getTaskById - Executing use case", {
        method: "getTaskById",
        requestId,
      });
      const task = await this.getTaskByIdUseCase.getTaskById(
        taskId,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );

      if (!task) {
        console.log("HttpTaskController.getTaskById - Task not found", {
          method: "getTaskById",
          requestId,
          taskId,
        });
        res.status(404).json({ error: "Task not found" });
        return;
      }

      console.log("HttpTaskController.getTaskById - Task found", {
        method: "getTaskById",
        requestId,
        taskId,
      });
      res.status(200).json({ data: task });
    } catch (error) {
      console.error("HttpTaskController.getTaskById failed", {
        method: "getTaskById",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        // Authorization errors
        if (error.message.includes("You don't have permission")) {
          console.warn("HttpTaskController.getTaskById - Authorization error", {
            method: "getTaskById",
            requestId,
            error: error.message,
          });
          res.status(403).json({ error: error.message });
          return;
        }
      }

      // Internal server error
      console.error("HttpTaskController.getTaskById - Internal server error", {
        method: "getTaskById",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Handles GET request to retrieve tasks with filtering and pagination.
   *
   * @param req - Vercel request object containing query parameters for filters and pagination
   * @param res - Vercel response object
   * @returns Promise that resolves when the response is sent
   * @throws May throw authentication, authorization, validation, or database errors
   */
  async getTasks(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);

    console.log("HttpTaskController.getTasks called", {
      method: "getTasks",
      requestId,
      endpoint: "GET /tasks",
      queryParams: req.query,
    });

    try {
      // Get authenticated user information from middleware
      console.log("HttpTaskController.getTasks - Authenticating user", {
        method: "getTasks",
        requestId,
      });
      const authContext = await authenticate(req, res);

      // Verify authentication
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn("HttpTaskController.getTasks - User not authenticated", {
          method: "getTasks",
          requestId,
        });
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      console.log("HttpTaskController.getTasks - User authenticated", {
        method: "getTasks",
        requestId,
        userId: authContext.user.id,
        userRole: authContext.user.role,
      });

      // Get filters from query string
      const filters: GetTasksFilters = {};

      if (req.query.status) {
        filters.status = req.query.status as string;
        console.log("HttpTaskController.getTasks - Status filter applied", {
          method: "getTasks",
          requestId,
          status: filters.status,
        });
      }

      if (req.query.priority) {
        filters.priority = req.query.priority as string;
        console.log("HttpTaskController.getTasks - Priority filter applied", {
          method: "getTasks",
          requestId,
          priority: filters.priority,
        });
      }

      if (req.query.assignedTo) {
        filters.assignedTo = req.query.assignedTo as string;
        console.log("HttpTaskController.getTasks - AssignedTo filter applied", {
          method: "getTasks",
          requestId,
          assignedTo: filters.assignedTo,
        });
      }

      if (req.query.createdBy) {
        filters.createdBy = req.query.createdBy as string;
        console.log("HttpTaskController.getTasks - CreatedBy filter applied", {
          method: "getTasks",
          requestId,
          createdBy: filters.createdBy,
        });
      }

      if (req.query.dueDateFrom) {
        const dueDateFrom = req.query.dueDateFrom as string;
        filters.dueDateFrom = new Date(dueDateFrom);
        console.log(
          "HttpTaskController.getTasks - DueDateFrom filter applied",
          {
            method: "getTasks",
            requestId,
            dueDateFrom: filters.dueDateFrom,
          },
        );
      }

      if (req.query.dueDateTo) {
        const dueDateTo = req.query.dueDateTo as string;
        filters.dueDateTo = new Date(dueDateTo);
        console.log("HttpTaskController.getTasks - DueDateTo filter applied", {
          method: "getTasks",
          requestId,
          dueDateTo: filters.dueDateTo,
        });
      }

      // Get pagination parameters
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      console.log("HttpTaskController.getTasks - Pagination parameters", {
        method: "getTasks",
        requestId,
        page,
        limit,
      });

      // Execute use case
      console.log("HttpTaskController.getTasks - Executing use case", {
        method: "getTasks",
        requestId,
      });
      const result = await this.getTasksUseCase.getTasks(
        filters,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
        page,
        limit,
      );
      console.log("HttpTaskController.getTasks - Use case completed", {
        method: "getTasks",
        requestId,
        tasksFound: result.tasks.length,
        total: result.total,
      });

      // Build response with pagination metadata
      const response = {
        data: result.tasks,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
          hasNext: result.page < Math.ceil(result.total / result.limit),
          hasPrev: result.page > 1,
        },
      };

      console.log("HttpTaskController.getTasks - Response built", {
        method: "getTasks",
        requestId,
        status: 200,
        totalPages: response.pagination.totalPages,
      });
      res.status(200).json(response);
    } catch (error) {
      console.error("HttpTaskController.getTasks failed", {
        method: "getTasks",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        // Authorization errors
        if (error.message.includes("You don't have permission")) {
          console.warn("HttpTaskController.getTasks - Authorization error", {
            method: "getTasks",
            requestId,
            error: error.message,
          });
          res.status(403).json({ error: error.message });
          return;
        }

        // Validation errors
        if (
          error.message.includes("validation") ||
          error.message.includes("invalid")
        ) {
          console.warn("HttpTaskController.getTasks - Validation error", {
            method: "getTasks",
            requestId,
            error: error.message,
          });
          res.status(400).json({ error: error.message });
          return;
        }
      }

      // Internal server error
      console.error("HttpTaskController.getTasks - Internal server error", {
        method: "getTasks",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Handles POST request to create a new task.
   *
   * @param req - Vercel request object containing task data in body
   * @param res - Vercel response object
   * @returns Promise that resolves when the response is sent
   * @throws May throw authentication, validation, or database errors
   */
  async createTask(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);

    console.log("HttpTaskController.createTask called", {
      method: "createTask",
      requestId,
      endpoint: "POST /tasks",
      body: req.body,
    });

    try {
      // Authentication
      const authContext = await authenticate(req, res);
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn("HttpTaskController.createTask - User not authenticated", {
          method: "createTask",
          requestId,
        });
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      // Create task (allowed for admin and user)
      const { title, description, status, priority, dueDate, assignedTo } =
        req.body;
      const input = {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedTo,
        createdBy: authContext.user.id, // ALWAYS the authenticated user
      };

      console.log("HttpTaskController.createTask - Creating task", {
        method: "createTask",
        requestId,
        createdBy: authContext.user.id,
        userRole: authContext.user.role,
      });

      const task = await this.createTaskUseCase.createTask(
        input,
        authContext.user.role.toUpperCase(),
      );

      console.log("HttpTaskController.createTask - Task created successfully", {
        method: "createTask",
        requestId,
        taskId: task.id,
      });

      res.status(201).json({ data: task });
    } catch (error) {
      console.error("HttpTaskController.createTask failed", {
        method: "createTask",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        if (error.message.includes("Missing fields")) {
          console.warn("HttpTaskController.createTask - Validation error", {
            method: "createTask",
            requestId,
            error: error.message,
          });
          res.status(400).json({ error: error.message });
          return;
        }
      }

      console.error("HttpTaskController.createTask - Internal server error", {
        method: "createTask",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Handles PUT request to update an existing task.
   *
   * @param req - Vercel request object containing task ID in query parameters and update data in body
   * @param res - Vercel response object
   * @returns Promise that resolves when the response is sent
   * @throws May throw authentication, authorization, validation, or database errors
   */
  async updateTask(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const taskId = req.query.id as string;

    console.log("HttpTaskController.updateTask called", {
      method: "updateTask",
      requestId,
      taskId,
      endpoint: "PUT /tasks/:id",
      body: req.body,
    });

    try {
      const authContext = await authenticate(req, res);
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn("HttpTaskController.updateTask - User not authenticated", {
          method: "updateTask",
          requestId,
        });
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      console.log("HttpTaskController.updateTask - Updating task", {
        method: "updateTask",
        requestId,
        taskId,
        userId: authContext.user.id,
        userRole: authContext.user.role,
      });

      const data = req.body;
      const updated = await this.updateTaskUseCase.updateTask(
        taskId,
        data,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );

      console.log("HttpTaskController.updateTask - Task updated successfully", {
        method: "updateTask",
        requestId,
        taskId,
      });

      res.status(200).json({ data: updated });
    } catch (error) {
      console.error("HttpTaskController.updateTask failed", {
        method: "updateTask",
        requestId,
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        if (error.message.includes("You don't have permission")) {
          console.warn("HttpTaskController.updateTask - Authorization error", {
            method: "updateTask",
            requestId,
            error: error.message,
          });
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message.includes("Task not found")) {
          console.warn("HttpTaskController.updateTask - Task not found", {
            method: "updateTask",
            requestId,
            taskId,
          });
          res.status(404).json({ error: error.message });
          return;
        }
      }

      console.error("HttpTaskController.updateTask - Internal server error", {
        method: "updateTask",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Handles DELETE request to remove a task.
   *
   * @param req - Vercel request object containing task ID in query parameters
   * @param res - Vercel response object
   * @returns Promise that resolves when the response is sent
   * @throws May throw authentication, authorization, or database errors
   */
  async deleteTask(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const taskId = req.query.id as string;

    console.log("HttpTaskController.deleteTask called", {
      method: "deleteTask",
      requestId,
      taskId,
      endpoint: "DELETE /tasks/:id",
    });

    try {
      const authContext = await authenticate(req, res);
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn("HttpTaskController.deleteTask - User not authenticated", {
          method: "deleteTask",
          requestId,
        });
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      console.log("HttpTaskController.deleteTask - User authenticated", {
        method: "deleteTask",
        requestId,
        userId: authContext.user.id,
        userRole: authContext.user.role,
      });

      await this.deleteTaskUseCase.deleteTask(
        taskId,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );

      console.log("HttpTaskController.deleteTask - Task deleted successfully", {
        method: "deleteTask",
        requestId,
        taskId,
      });
      res.status(204).end();
    } catch (error) {
      console.error("HttpTaskController.deleteTask failed", {
        method: "deleteTask",
        requestId,
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        if (error.message.includes("You don't have permission")) {
          console.warn("HttpTaskController.deleteTask - Authorization error", {
            method: "deleteTask",
            requestId,
            error: error.message,
          });
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message.includes("Task not found")) {
          console.warn("HttpTaskController.deleteTask - Task not found", {
            method: "deleteTask",
            requestId,
            taskId,
          });
          res.status(404).json({ error: error.message });
          return;
        }
      }

      console.error("HttpTaskController.deleteTask - Internal server error", {
        method: "deleteTask",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Handles POST request to assign a task to a user.
   *
   * @param req - Vercel request object containing task ID in query parameters and user ID in body
   * @param res - Vercel response object
   * @returns Promise that resolves when the response is sent
   * @throws May throw authentication, authorization, validation, or database errors
   */
  async assignTask(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const taskId = req.query.id as string;

    console.log("HttpTaskController.assignTask called", {
      method: "assignTask",
      requestId,
      taskId,
      endpoint: "POST /tasks/:id/assign",
      body: req.body,
    });

    try {
      // Get authenticated user information from middleware
      console.log("HttpTaskController.assignTask - Authenticating user", {
        method: "assignTask",
        requestId,
      });
      const authContext = await authenticate(req, res);

      // Verify authentication
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn("HttpTaskController.assignTask - User not authenticated", {
          method: "assignTask",
          requestId,
        });
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      console.log("HttpTaskController.assignTask - User authenticated", {
        method: "assignTask",
        requestId,
        userId: authContext.user.id,
        userRole: authContext.user.role,
      });

      // Get the user ID to assign the task to
      const { userId } = req.body;

      if (!userId) {
        console.warn("HttpTaskController.assignTask - Missing userId field", {
          method: "assignTask",
          requestId,
        });
        res.status(400).json({ error: "The userId field is required" });
        return;
      }

      console.log("HttpTaskController.assignTask - Assigning task", {
        method: "assignTask",
        requestId,
        taskId,
        targetUserId: userId,
      });

      // Execute use case
      console.log("HttpTaskController.assignTask - Executing use case", {
        method: "assignTask",
        requestId,
      });
      const result = await this.assignTaskUseCase.assignTask(
        taskId,
        userId,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );

      console.log(
        "HttpTaskController.assignTask - Task assigned successfully",
        {
          method: "assignTask",
          requestId,
          taskId,
        },
      );
      res.status(200).json({
        data: result.task,
        message: result.message,
      });
    } catch (error) {
      console.error("HttpTaskController.assignTask failed", {
        method: "assignTask",
        requestId,
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        // Authorization errors
        if (error.message.includes("Only administrators can assign tasks")) {
          console.warn("HttpTaskController.assignTask - Authorization error", {
            method: "assignTask",
            requestId,
            error: error.message,
          });
          res.status(403).json({ error: error.message });
          return;
        }

        // Validation errors
        if (
          error.message.includes("Invalid task ID") ||
          error.message.includes("Invalid user ID") ||
          error.message.includes("The userId field is required")
        ) {
          console.warn("HttpTaskController.assignTask - Validation error", {
            method: "assignTask",
            requestId,
            error: error.message,
          });
          res.status(400).json({ error: error.message });
          return;
        }

        // Task not found
        if (error.message.includes("Task not found")) {
          console.warn("HttpTaskController.assignTask - Task not found", {
            method: "assignTask",
            requestId,
            taskId,
          });
          res.status(404).json({ error: error.message });
          return;
        }

        // Business logic error
        if (error.message.includes("cannot be assigned")) {
          console.warn("HttpTaskController.assignTask - Business logic error", {
            method: "assignTask",
            requestId,
            error: error.message,
          });
          res.status(400).json({ error: error.message });
          return;
        }
      }

      // Internal server error
      console.error("HttpTaskController.assignTask - Internal server error", {
        method: "assignTask",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Handles GET request to retrieve tasks for a specific user.
   *
   * @param req - Vercel request object containing user ID in query parameters and optional filters
   * @param res - Vercel response object
   * @returns Promise that resolves when the response is sent
   * @throws May throw authentication, authorization, validation, or database errors
   */
  async getUserTasks(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const userId = req.query.id as string;

    console.log("HttpTaskController.getUserTasks called", {
      method: "getUserTasks",
      requestId,
      userId,
      endpoint: "GET /users/:id/tasks",
      queryParams: req.query,
    });

    try {
      // Get authenticated user information from middleware
      console.log("HttpTaskController.getUserTasks - Authenticating user", {
        method: "getUserTasks",
        requestId,
      });
      const authContext = await authenticate(req, res);

      // Verify authentication
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn(
          "HttpTaskController.getUserTasks - User not authenticated",
          {
            method: "getUserTasks",
            requestId,
          },
        );
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      console.log("HttpTaskController.getUserTasks - User authenticated", {
        method: "getUserTasks",
        requestId,
        userId: authContext.user.id,
        userRole: authContext.user.role,
      });

      // Get filters from query string
      const filters: GetTasksFilters = {};

      if (req.query.status) {
        filters.status = req.query.status as string;
        console.log("HttpTaskController.getUserTasks - Status filter applied", {
          method: "getUserTasks",
          requestId,
          status: filters.status,
        });
      }

      if (req.query.priority) {
        filters.priority = req.query.priority as string;
        console.log(
          "HttpTaskController.getUserTasks - Priority filter applied",
          {
            method: "getUserTasks",
            requestId,
            priority: filters.priority,
          },
        );
      }

      if (req.query.assignedTo) {
        filters.assignedTo = req.query.assignedTo as string;
        console.log(
          "HttpTaskController.getUserTasks - AssignedTo filter applied",
          {
            method: "getUserTasks",
            requestId,
            assignedTo: filters.assignedTo,
          },
        );
      }

      if (req.query.createdBy) {
        filters.createdBy = req.query.createdBy as string;
        console.log(
          "HttpTaskController.getUserTasks - CreatedBy filter applied",
          {
            method: "getUserTasks",
            requestId,
            createdBy: filters.createdBy,
          },
        );
      }

      if (req.query.dueDateFrom) {
        const dueDateFrom = req.query.dueDateFrom as string;
        filters.dueDateFrom = new Date(dueDateFrom);
        console.log(
          "HttpTaskController.getUserTasks - DueDateFrom filter applied",
          {
            method: "getUserTasks",
            requestId,
            dueDateFrom: filters.dueDateFrom,
          },
        );
      }

      if (req.query.dueDateTo) {
        const dueDateTo = req.query.dueDateTo as string;
        filters.dueDateTo = new Date(dueDateTo);
        console.log(
          "HttpTaskController.getUserTasks - DueDateTo filter applied",
          {
            method: "getUserTasks",
            requestId,
            dueDateTo: filters.dueDateTo,
          },
        );
      }

      // Get pagination parameters
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      console.log("HttpTaskController.getUserTasks - Pagination parameters", {
        method: "getUserTasks",
        requestId,
        page,
        limit,
      });

      // Execute use case
      console.log("HttpTaskController.getUserTasks - Executing use case", {
        method: "getUserTasks",
        requestId,
      });
      const result = await this.getUserTasksUseCase.getUserTasks(
        {
          userId,
          filters,
          page,
          limit,
        },
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );

      console.log("HttpTaskController.getUserTasks - Use case completed", {
        method: "getUserTasks",
        requestId,
        tasksFound: result.tasks.length,
        total: result.total,
      });

      // Build response with pagination metadata
      const response = {
        data: result.tasks,
        userId: result.userId,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
          hasNext: result.page < Math.ceil(result.total / result.limit),
          hasPrev: result.page > 1,
        },
      };

      console.log("HttpTaskController.getUserTasks - Response built", {
        method: "getUserTasks",
        requestId,
        status: 200,
        totalPages: response.pagination.totalPages,
      });
      res.status(200).json(response);
    } catch (error) {
      console.error("HttpTaskController.getUserTasks failed", {
        method: "getUserTasks",
        requestId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        // Authorization errors
        if (error.message.includes("You don't have permission")) {
          console.warn(
            "HttpTaskController.getUserTasks - Authorization error",
            {
              method: "getUserTasks",
              requestId,
              error: error.message,
            },
          );
          res.status(403).json({ error: error.message });
          return;
        }

        // Validation errors
        if (error.message.includes("Invalid user ID")) {
          console.warn("HttpTaskController.getUserTasks - Validation error", {
            method: "getUserTasks",
            requestId,
            error: error.message,
          });
          res.status(400).json({ error: error.message });
          return;
        }

        // User not found
        if (error.message.includes("User not found")) {
          console.warn("HttpTaskController.getUserTasks - User not found", {
            method: "getUserTasks",
            requestId,
            userId,
          });
          res.status(404).json({ error: error.message });
          return;
        }
      }

      // Internal server error
      console.error("HttpTaskController.getUserTasks - Internal server error", {
        method: "getUserTasks",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Handles GET request to generate AI-powered task summary.
   *
   * @param req - Vercel request object containing optional limit parameter
   * @param res - Vercel response object
   * @returns Promise that resolves when the response is sent
   * @throws May throw authentication, authorization, or AI service errors
   */
  async getTaskSummary(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);

    console.log("HttpTaskController.getTaskSummary called", {
      method: "getTaskSummary",
      requestId,
      endpoint: "GET /tasks/summary",
      queryParams: req.query,
    });

    try {
      // Authenticate user
      const authContext = await authenticate(req, res);
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn(
          "HttpTaskController.getTaskSummary - User not authenticated",
          {
            method: "getTaskSummary",
            requestId,
          },
        );
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const { id: userId, role } = authContext.user;
      console.log("HttpTaskController.getTaskSummary - User authenticated", {
        method: "getTaskSummary",
        requestId,
        userId,
        userRole: role,
      });

      // Parse query parameters
      const limitParam = req.query.limit as string;
      const limit = limitParam ? parseInt(limitParam, 10) : 10;

      // Validate limit parameter
      if (isNaN(limit) || limit < 1 || limit > 50) {
        console.warn(
          "HttpTaskController.getTaskSummary - Invalid limit parameter",
          {
            method: "getTaskSummary",
            requestId,
            limitParam,
          },
        );
        res.status(400).json({
          error: "Limit must be a number between 1 and 50",
        });
        return;
      }

      console.log("HttpTaskController.getTaskSummary - Processing request", {
        method: "getTaskSummary",
        requestId,
        limit,
      });

      // Execute use case
      const result = await this.getTaskSummaryUseCase.execute({
        limit,
        authContext: { userId, role },
      });

      console.log(
        "HttpTaskController.getTaskSummary - Summary generated successfully",
        {
          method: "getTaskSummary",
          requestId,
          taskCount: result.taskCount,
        },
      );

      // Return success response
      res.status(200).json({
        summary: result.summary,
        taskCount: result.taskCount,
        userRole: result.userRole,
        limit: limit,
      });
    } catch (error) {
      console.error("HttpTaskController.getTaskSummary failed", {
        method: "getTaskSummary",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        if (error.message.includes("GEMINI_API_KEY")) {
          console.warn(
            "HttpTaskController.getTaskSummary - AI service configuration error",
            {
              method: "getTaskSummary",
              requestId,
              error: error.message,
            },
          );
          res.status(500).json({ error: "AI service configuration error" });
          return;
        }

        if (error.message.includes("Authentication required")) {
          console.warn(
            "HttpTaskController.getTaskSummary - Authentication error",
            {
              method: "getTaskSummary",
              requestId,
              error: error.message,
            },
          );
          res.status(401).json({ error: "Authentication required" });
          return;
        }
      }

      // Generic error response
      console.error(
        "HttpTaskController.getTaskSummary - Internal server error",
        {
          method: "getTaskSummary",
          requestId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
