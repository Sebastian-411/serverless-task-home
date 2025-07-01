import type { PrismaClient } from "../../../lib/generated/prisma";
import type { TaskStatus, TaskPriority } from "../domain";
import { Task } from "../domain";
import type { GetTasksFilters } from "../domain/ports/in/task-controller.port";
import type { TaskRepositoryPort } from "../application";

/**
 * Prisma implementation of the Task repository interface.
 * Handles all database operations for Task entities using Prisma ORM.
 */
export class TaskRepositoryPrisma implements TaskRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  /**
   * Retrieves tasks based on filters and user permissions with pagination support.
   *
   * @param filters - Object containing filter criteria for tasks (status, priority, assignedTo, createdBy, dueDateFrom, dueDateTo)
   * @param userId - ID of the user making the request
   * @param userRole - Role of the user (ADMIN or regular user)
   * @param page - Page number for pagination (1-based)
   * @param limit - Number of tasks per page
   * @returns Promise resolving to an object containing tasks array and total count
   * @throws May throw Prisma database errors
   */
  async findTasks(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
    page: number,
    limit: number,
  ): Promise<{ tasks: Task[]; total: number }> {
    console.log("TaskRepository.findTasks called", {
      method: "findTasks",
      userId,
      userRole,
      filters,
      page,
      limit,
    });

    // Build Prisma filters
    const where = this.buildWhereClause(filters, userId, userRole);

    // Get total records count
    const total = await this.prisma.task.count({ where });

    // Get tasks with pagination
    const tasksData = await this.prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Convert Prisma data to domain entities
    const tasks = tasksData.map((taskData) => this.mapToTask(taskData));

    console.log("TaskRepository.findTasks completed", {
      method: "findTasks",
      userId,
      total,
      tasksFound: tasks.length,
    });

    return { tasks, total };
  }

  /**
   * Retrieves a specific task by its ID.
   *
   * @param id - Unique identifier of the task to retrieve
   * @returns Promise resolving to Task entity if found, null otherwise
   * @throws May throw Prisma database errors
   */
  async findTaskById(id: string): Promise<Task | null> {
    console.log("TaskRepository.findTaskById called", {
      method: "findTaskById",
      taskId: id,
    });

    const taskData = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!taskData) {
      console.warn("TaskRepository.findTaskById - Task not found", {
        method: "findTaskById",
        taskId: id,
      });
      return null;
    }

    const task = this.mapToTask(taskData);
    console.log("TaskRepository.findTaskById completed", {
      method: "findTaskById",
      taskId: id,
      taskFound: true,
    });

    return task;
  }

  /**
   * Builds the WHERE clause for Prisma queries based on filters and user permissions.
   *
   * @param filters - Object containing filter criteria
   * @param userId - ID of the user making the request
   * @param userRole - Role of the user (ADMIN or regular user)
   * @returns Object containing Prisma WHERE clause conditions
   */
  private buildWhereClause(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
  ) {
    console.log("TaskRepository.buildWhereClause called", {
      method: "buildWhereClause",
      userId,
      userRole,
      filters,
    });

    const where: any = {};

    // Basic filters
    if (filters.status) {
      where.status = filters.status as TaskStatus;
    }

    if (filters.priority) {
      where.priority = filters.priority as TaskPriority;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    // Date filters
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = filters.dueDateFrom;
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = filters.dueDateTo;
      }
    }

    // Authorization filters
    if (userRole !== "ADMIN") {
      // Regular users can only see tasks they created or were assigned to them
      where.OR = [{ createdBy: userId }, { assignedTo: userId }];
    }

    console.log("TaskRepository.buildWhereClause completed", {
      method: "buildWhereClause",
      whereClause: where,
    });

    return where;
  }

  /**
   * Maps Prisma task data to Task domain entity.
   *
   * @param taskData - Raw task data from Prisma
   * @returns Task domain entity
   */
  private mapToTask(taskData: any): Task {
    return new Task({
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status as TaskStatus,
      priority: taskData.priority as TaskPriority,
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
      assignedTo: taskData.assignedTo || undefined,
      createdBy: taskData.createdBy,
      createdAt: taskData.createdAt.toISOString(),
      updatedAt: taskData.updatedAt.toISOString(),
    });
  }

  /**
   * Creates a new task in the database.
   *
   * @param data - Object containing task data (title, description, status, priority, dueDate, assignedTo, createdBy)
   * @returns Promise resolving to the created Task entity
   * @throws May throw Prisma database errors for validation failures or constraint violations
   */
  async createTask(data: any): Promise<Task> {
    console.log("TaskRepository.createTask called", {
      method: "createTask",
      taskData: {
        title: data.title,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo,
        createdBy: data.createdBy,
      },
    });

    try {
      const created = await this.prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          status: data.status || "PENDING",
          priority: data.priority || "MEDIUM",
          dueDate: data.dueDate,
          assignedTo: data.assignedTo,
          createdBy: data.createdBy,
        },
      });

      const task = this.mapToTask(created);
      console.log("TaskRepository.createTask completed", {
        method: "createTask",
        taskId: task.id,
        createdBy: data.createdBy,
      });

      return task;
    } catch (error) {
      console.error("TaskRepository.createTask failed", {
        method: "createTask",
        error: error instanceof Error ? error.message : String(error),
        taskData: {
          title: data.title,
          createdBy: data.createdBy,
        },
      });
      throw error;
    }
  }

  /**
   * Updates an existing task in the database.
   *
   * @param id - Unique identifier of the task to update
   * @param data - Object containing updated task data (title, description, status, priority, dueDate, assignedTo)
   * @returns Promise resolving to the updated Task entity
   * @throws May throw Prisma database errors for validation failures, constraint violations, or if task not found
   */
  async updateTask(id: string, data: any): Promise<Task> {
    console.log("TaskRepository.updateTask called", {
      method: "updateTask",
      taskId: id,
      updateData: {
        title: data.title,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo,
      },
    });

    try {
      const updated = await this.prisma.task.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate,
          assignedTo: data.assignedTo,
        },
      });

      const task = this.mapToTask(updated);
      console.log("TaskRepository.updateTask completed", {
        method: "updateTask",
        taskId: id,
      });

      return task;
    } catch (error) {
      console.error("TaskRepository.updateTask failed", {
        method: "updateTask",
        taskId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Deletes a task from the database.
   *
   * @param id - Unique identifier of the task to delete
   * @returns Promise that resolves when the task is successfully deleted
   * @throws May throw Prisma database errors if task not found or deletion fails
   */
  async deleteTask(id: string): Promise<void> {
    console.log("TaskRepository.deleteTask called", {
      method: "deleteTask",
      taskId: id,
    });

    try {
      await this.prisma.task.delete({
        where: { id },
      });

      console.log("TaskRepository.deleteTask completed", {
        method: "deleteTask",
        taskId: id,
      });
    } catch (error) {
      console.error("TaskRepository.deleteTask failed", {
        method: "deleteTask",
        taskId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Finds the most recent tasks in the system.
   *
   * @param limit - Maximum number of tasks to return
   * @returns Promise resolving to array of recent tasks
   */
  async findRecentTasks(limit: number): Promise<Task[]> {
    console.log("TaskRepository.findRecentTasks called", {
      method: "findRecentTasks",
      limit,
    });

    try {
      const tasks = await this.prisma.task.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const mappedTasks = tasks.map((task) => this.mapToTask(task));

      console.log("TaskRepository.findRecentTasks completed", {
        method: "findRecentTasks",
        tasksFound: mappedTasks.length,
        limit,
      });

      return mappedTasks;
    } catch (error) {
      console.error("TaskRepository.findRecentTasks failed", {
        method: "findRecentTasks",
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Finds the most recent tasks assigned to a specific user.
   *
   * @param userId - ID of the user
   * @param limit - Maximum number of tasks to return
   * @returns Promise resolving to array of recent tasks assigned to the user
   */
  async findRecentTasksByUser(userId: string, limit: number): Promise<Task[]> {
    console.log("TaskRepository.findRecentTasksByUser called", {
      method: "findRecentTasksByUser",
      userId,
      limit,
    });

    try {
      const tasks = await this.prisma.task.findMany({
        where: { assignedTo: userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const mappedTasks = tasks.map((task) => this.mapToTask(task));

      console.log("TaskRepository.findRecentTasksByUser completed", {
        method: "findRecentTasksByUser",
        userId,
        tasksFound: mappedTasks.length,
        limit,
      });

      return mappedTasks;
    } catch (error) {
      console.error("TaskRepository.findRecentTasksByUser failed", {
        method: "findRecentTasksByUser",
        userId,
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
