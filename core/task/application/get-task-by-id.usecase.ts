import type { Task, TaskData } from "../domain";

/**
 * Repository port interface for task retrieval operations.
 * Defines the contract for finding tasks by their unique identifier.
 */
export interface TaskRepositoryPort {
  /**
   * Finds a specific task by its ID.
   *
   * @param id - Unique identifier of the task to retrieve
   * @returns Promise resolving to Task entity if found, null otherwise
   */
  findTaskById(id: string): Promise<Task | null>;
}

/**
 * Use case for retrieving a specific task by ID with authorization checks.
 * Handles the business logic for task retrieval including permission validation.
 * Ensures users can only access tasks they are authorized to view.
 */
export class GetTaskByIdUseCase {
  /**
   * Creates a new GetTaskByIdUseCase instance.
   *
   * @param taskRepository - Repository interface for task data operations
   */
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Retrieves a specific task by ID based on user permissions.
   *
   * This method performs the following steps:
   * 1. Retrieves the task from the repository
   * 2. Checks if the task exists
   * 3. Validates user authorization to view the task
   * 4. Converts the entity to DTO format and returns it
   *
   * @param taskId - Unique identifier of the task to retrieve
   * @param userId - ID of the authenticated user making the request
   * @param userRole - Role of the authenticated user ('ADMIN' or 'USER')
   * @returns Promise resolving to TaskData if found and authorized, null if not found
   * @throws Error if user lacks permission to view the task
   * @throws DatabaseError if repository operation fails
   */
  async getTaskById(
    taskId: string,
    userId: string,
    userRole: string,
  ): Promise<TaskData | null> {
    console.log("GetTaskByIdUseCase.getTaskById called", {
      method: "getTaskById",
      taskId,
      userId,
      userRole,
    });

    // Get task from repository
    console.log(
      "GetTaskByIdUseCase.getTaskById - Retrieving task from repository",
      {
        method: "getTaskById",
        taskId,
      },
    );
    const task = await this.taskRepository.findTaskById(taskId);

    if (!task) {
      console.log("GetTaskByIdUseCase.getTaskById - Task not found", {
        method: "getTaskById",
        taskId,
        userId,
      });
      return null;
    }

    console.log("GetTaskByIdUseCase.getTaskById - Task found", {
      method: "getTaskById",
      taskId,
      taskCreatedBy: task.createdBy,
      taskAssignedTo: task.assignedTo,
    });

    // Verify authorization
    console.log("GetTaskByIdUseCase.getTaskById - Checking authorization", {
      method: "getTaskById",
      taskId,
      userId,
      userRole,
    });
    if (!this.isAuthorized(task, userId, userRole)) {
      console.warn("GetTaskByIdUseCase.getTaskById - Authorization failed", {
        method: "getTaskById",
        taskId,
        userId,
        userRole,
        taskCreatedBy: task.createdBy,
        taskAssignedTo: task.assignedTo,
        reason: "User lacks permission to view this task",
      });
      throw new Error("You don't have permission to view this task");
    }

    console.log("GetTaskByIdUseCase.getTaskById - Authorization passed", {
      method: "getTaskById",
      taskId,
      userId,
      userRole,
    });

    // Convert entity to DTO
    console.log("GetTaskByIdUseCase.getTaskById - Converting entity to DTO", {
      method: "getTaskById",
      taskId,
    });
    const taskData = task.toJSON() as unknown as TaskData;

    console.log("GetTaskByIdUseCase.getTaskById completed", {
      method: "getTaskById",
      taskId,
      userId,
      taskReturned: true,
    });

    return taskData;
  }

  /**
   * Verifies if the user has permission to view the task.
   *
   * Authorization rules:
   * - Administrators can view any task
   * - Regular users can only view tasks they created or were assigned to them
   *
   * @param task - Task entity to check authorization for
   * @param userId - ID of the user requesting access
   * @param userRole - Role of the user requesting access ('ADMIN' or 'USER')
   * @returns true if the user has permission to view the task, false otherwise
   */
  private isAuthorized(task: Task, userId: string, userRole: string): boolean {
    console.log("GetTaskByIdUseCase.isAuthorized called", {
      method: "isAuthorized",
      taskId: task.id,
      userId,
      userRole,
      taskCreatedBy: task.createdBy,
      taskAssignedTo: task.assignedTo,
    });

    // Administrators can view any task
    if (userRole === "ADMIN") {
      console.log("GetTaskByIdUseCase.isAuthorized - Admin access granted", {
        method: "isAuthorized",
        taskId: task.id,
        userId,
        userRole,
      });
      return true;
    }

    // Regular users can view tasks assigned to them or that they created
    const isAuthorized =
      task.assignedTo === userId || task.createdBy === userId;

    console.log("GetTaskByIdUseCase.isAuthorized completed", {
      method: "isAuthorized",
      taskId: task.id,
      userId,
      userRole,
      isAuthorized,
      reason: isAuthorized
        ? "User is creator or assignee"
        : "User lacks permission",
    });

    return isAuthorized;
  }
}
