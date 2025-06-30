import type { Task, TaskData } from "../domain";
import { TaskStatus, TaskPriority } from "../domain";
import type {
  GetTasksFilters,
  GetTasksResult,
} from "../domain/ports/in/task-controller.port";
import { TaskControllerPort } from "../domain/ports/in/task-controller.port";

/**
 * Repository port interface for task operations.
 * Defines the contract for task data access operations including
 * retrieval, updates, and deletion with filtering and pagination support.
 */
export interface TaskRepositoryPort {
  /**
   * Finds tasks based on filters and user permissions with pagination.
   *
   * @param filters - Filter criteria for tasks
   * @param userId - ID of the authenticated user
   * @param userRole - Role of the authenticated user
   * @param page - Page number for pagination
   * @param limit - Number of tasks per page
   * @returns Promise resolving to tasks array and total count
   */
  findTasks(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
    page: number,
    limit: number,
  ): Promise<{ tasks: Task[]; total: number }>;

  /**
   * Finds a specific task by its ID.
   *
   * @param id - Unique identifier of the task
   * @returns Promise resolving to Task entity or null if not found
   */
  findTaskById(id: string): Promise<Task | null>;

  /**
   * Updates an existing task with new data.
   *
   * @param id - Unique identifier of the task to update
   * @param data - Data to update the task with
   * @returns Promise resolving to the updated Task entity
   */
  updateTask(id: string, data: any): Promise<Task>;

  /**
   * Deletes a task from the system.
   *
   * @param id - Unique identifier of the task to delete
   * @returns Promise that resolves when the task is deleted
   */
  deleteTask(id: string): Promise<void>;
}

/**
 * Use case for retrieving tasks with filtering and pagination support.
 * Handles authorization, validation, and data retrieval for task queries.
 * Ensures users can only access tasks they are authorized to view.
 */
export class GetTasksUseCase {
  /**
   * Creates a new GetTasksUseCase instance.
   *
   * @param taskRepository - Repository interface for task data operations
   */
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Retrieves tasks based on filters and user permissions with pagination support.
   *
   * This method performs the following steps:
   * 1. Validates and normalizes pagination parameters
   * 2. Applies authorization-based filters according to user role
   * 3. Validates and normalizes filter criteria
   * 4. Retrieves tasks from the repository
   * 5. Converts entities to DTOs and returns results
   *
   * @param filters - Optional filters to apply to the task query (status, priority, assignedTo, createdBy, dueDateFrom, dueDateTo)
   * @param userId - ID of the authenticated user making the request
   * @param userRole - Role of the authenticated user ('ADMIN' or 'USER')
   * @param page - Page number for pagination (optional, defaults to 1)
   * @param limit - Number of tasks per page (optional, defaults to 10, max 100)
   * @returns Promise resolving to GetTasksResult containing tasks and pagination metadata
   * @throws Error if repository operation fails
   * @throws Error if user lacks permission to view specific tasks
   * @throws Error if filter validation fails
   */
  async getTasks(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<GetTasksResult> {
    console.log("GetTasksUseCase.getTasks called", {
      method: "getTasks",
      userId,
      userRole,
      filters,
      page,
      limit,
    });

    // Validate parameters
    const originalPage = page;
    const originalLimit = limit;
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    console.log("GetTasksUseCase.getTasks - Parameters normalized", {
      method: "getTasks",
      originalPage,
      originalLimit,
      normalizedPage: page,
      normalizedLimit: limit,
    });

    // Apply authorization filters based on user role (before validation)
    console.log("GetTasksUseCase.getTasks - Applying authorization filters", {
      method: "getTasks",
      userRole,
      originalFilters: filters,
    });
    const authorizedFilters = this.applyAuthorizationFilters(
      filters,
      userId,
      userRole,
    );

    // Validate filters after authorization
    console.log("GetTasksUseCase.getTasks - Validating filters", {
      method: "getTasks",
      authorizedFilters,
    });
    const validatedFilters = this.validateFilters(authorizedFilters);

    // Get tasks from repository
    console.log("GetTasksUseCase.getTasks - Retrieving tasks from repository", {
      method: "getTasks",
      validatedFilters,
      page,
      limit,
    });
    const result = await this.taskRepository.findTasks(
      validatedFilters,
      userId,
      userRole,
      page,
      limit,
    );

    if (!result) {
      console.error(
        "GetTasksUseCase.getTasks - Repository returned null result",
        {
          method: "getTasks",
          userId,
          userRole,
        },
      );
      throw new Error("Error retrieving tasks from repository");
    }

    const { tasks, total } = result;
    console.log("GetTasksUseCase.getTasks - Tasks retrieved from repository", {
      method: "getTasks",
      tasksFound: tasks.length,
      total,
    });

    // Convert entities to DTOs
    console.log("GetTasksUseCase.getTasks - Converting entities to DTOs", {
      method: "getTasks",
      taskCount: tasks.length,
    });
    const taskData = tasks.map((task) => task.toJSON() as unknown as TaskData);

    const response = {
      tasks: taskData,
      total,
      page,
      limit,
    };

    console.log("GetTasksUseCase.getTasks completed", {
      method: "getTasks",
      userId,
      tasksReturned: taskData.length,
      total,
      page,
      limit,
    });

    return response;
  }

  /**
   * Validates and normalizes input filters.
   * Ensures filter values are valid and converts them to appropriate types.
   *
   * @param filters - Raw filter criteria to validate
   * @returns Validated and normalized filter criteria
   */
  private validateFilters(filters: GetTasksFilters): GetTasksFilters {
    console.log("GetTasksUseCase.validateFilters called", {
      method: "validateFilters",
      filters,
    });

    const validated: GetTasksFilters = {};

    // Validate status
    if (
      filters.status &&
      Object.values(TaskStatus).includes(filters.status as TaskStatus)
    ) {
      validated.status = filters.status;
      console.log("GetTasksUseCase.validateFilters - Status validated", {
        method: "validateFilters",
        status: filters.status,
      });
    } else if (filters.status) {
      console.warn("GetTasksUseCase.validateFilters - Invalid status filter", {
        method: "validateFilters",
        invalidStatus: filters.status,
      });
    }

    // Validate priority
    if (
      filters.priority &&
      Object.values(TaskPriority).includes(filters.priority as TaskPriority)
    ) {
      validated.priority = filters.priority;
      console.log("GetTasksUseCase.validateFilters - Priority validated", {
        method: "validateFilters",
        priority: filters.priority,
      });
    } else if (filters.priority) {
      console.warn(
        "GetTasksUseCase.validateFilters - Invalid priority filter",
        {
          method: "validateFilters",
          invalidPriority: filters.priority,
        },
      );
    }

    // Validate assignedTo (can be any non-empty string)
    if (filters.assignedTo && filters.assignedTo.trim()) {
      validated.assignedTo = filters.assignedTo;
      console.log("GetTasksUseCase.validateFilters - AssignedTo validated", {
        method: "validateFilters",
        assignedTo: filters.assignedTo,
      });
    }

    // Validate createdBy (can be any non-empty string)
    if (filters.createdBy && filters.createdBy.trim()) {
      validated.createdBy = filters.createdBy;
      console.log("GetTasksUseCase.validateFilters - CreatedBy validated", {
        method: "validateFilters",
        createdBy: filters.createdBy,
      });
    }

    // Validate dates
    if (
      filters.dueDateFrom &&
      !isNaN(new Date(filters.dueDateFrom).getTime())
    ) {
      validated.dueDateFrom = new Date(filters.dueDateFrom);
      console.log("GetTasksUseCase.validateFilters - DueDateFrom validated", {
        method: "validateFilters",
        dueDateFrom: filters.dueDateFrom,
      });
    } else if (filters.dueDateFrom) {
      console.warn("GetTasksUseCase.validateFilters - Invalid dueDateFrom", {
        method: "validateFilters",
        invalidDueDateFrom: filters.dueDateFrom,
      });
    }

    if (filters.dueDateTo && !isNaN(new Date(filters.dueDateTo).getTime())) {
      validated.dueDateTo = new Date(filters.dueDateTo);
      console.log("GetTasksUseCase.validateFilters - DueDateTo validated", {
        method: "validateFilters",
        dueDateTo: filters.dueDateTo,
      });
    } else if (filters.dueDateTo) {
      console.warn("GetTasksUseCase.validateFilters - Invalid dueDateTo", {
        method: "validateFilters",
        invalidDueDateTo: filters.dueDateTo,
      });
    }

    console.log("GetTasksUseCase.validateFilters completed", {
      method: "validateFilters",
      originalFilters: filters,
      validatedFilters: validated,
    });

    return validated;
  }

  /**
   * Applies authorization-based filters according to user role.
   * Regular users cannot filter by other users' tasks, while administrators have full access.
   *
   * @param filters - Original filter criteria
   * @param userId - ID of the authenticated user
   * @param userRole - Role of the authenticated user ('ADMIN' or 'USER')
   * @returns Filtered criteria that respect user permissions
   * @throws Error if user attempts to filter by unauthorized criteria
   */
  private applyAuthorizationFilters(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
  ): GetTasksFilters {
    console.log("GetTasksUseCase.applyAuthorizationFilters called", {
      method: "applyAuthorizationFilters",
      filters,
      userId,
      userRole,
    });

    const authorizedFilters = { ...filters };

    // If user is not ADMIN, apply authorization restrictions
    if (userRole !== "ADMIN") {
      // If there are specific filters, verify that the user has permissions
      if (filters.assignedTo && filters.assignedTo !== userId) {
        console.warn(
          "GetTasksUseCase.applyAuthorizationFilters - Unauthorized assignedTo filter",
          {
            method: "applyAuthorizationFilters",
            requestedAssignedTo: filters.assignedTo,
            userId,
            userRole,
          },
        );
        throw new Error(
          "You don't have permission to view tasks assigned to other users",
        );
      }
      if (filters.createdBy && filters.createdBy !== userId) {
        console.warn(
          "GetTasksUseCase.applyAuthorizationFilters - Unauthorized createdBy filter",
          {
            method: "applyAuthorizationFilters",
            requestedCreatedBy: filters.createdBy,
            userId,
            userRole,
          },
        );
        throw new Error(
          "You don't have permission to view tasks created by other users",
        );
      }

      // If there are no specific filters, don't apply additional filters here
      // Authorization logic will be handled in the repository
    }

    console.log("GetTasksUseCase.applyAuthorizationFilters completed", {
      method: "applyAuthorizationFilters",
      originalFilters: filters,
      authorizedFilters,
      userRole,
    });

    return authorizedFilters;
  }

  /**
   * Validates if a string is a valid UUID format.
   * Uses regex pattern to check UUID v1-v5 format compliance.
   *
   * @param uuid - String to validate as UUID
   * @returns true if the string is a valid UUID, false otherwise
   */
  private isValidUUID(uuid: string): boolean {
    console.log("GetTasksUseCase.isValidUUID called", {
      method: "isValidUUID",
      uuid,
    });

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValid = uuidRegex.test(uuid);

    console.log("GetTasksUseCase.isValidUUID completed", {
      method: "isValidUUID",
      uuid,
      isValid,
    });

    return isValid;
  }
}
