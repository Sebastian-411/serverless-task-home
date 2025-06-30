import type { TaskData } from "../domain";
import { Task } from "../domain";
import type { GetTasksFilters } from "../domain/ports/in/task-controller.port";
import { GetTasksResult } from "../domain/ports/in/task-controller.port";

import type { TaskRepositoryPort } from "./get-tasks.usecase";

/**
 * Request structure for retrieving tasks for a specific user.
 * Contains user identification and optional filtering/pagination parameters.
 */
export interface GetUserTasksRequest {
  userId: string;
  filters?: GetTasksFilters;
  page?: number;
  limit?: number;
}

/**
 * Result structure for user tasks query.
 * Contains task data, pagination metadata, and user identification.
 */
export interface GetUserTasksResult {
  tasks: TaskData[];
  total: number;
  page: number;
  limit: number;
  userId: string;
}

/**
 * Use case for retrieving tasks for a specific user.
 * Handles authorization, validation, filtering, and pagination for user-specific task queries.
 * Ensures users can only access tasks they are authorized to view.
 */
export class GetUserTasksUseCase {
  /**
   * Creates a new GetUserTasksUseCase instance.
   *
   * @param taskRepository - Repository interface for task data operations
   */
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Retrieves tasks for a specific user with filtering and pagination support.
   *
   * This method performs the following steps:
   * 1. Validates the target user ID format
   * 2. Checks user authorization to view the target user's tasks
   * 3. Normalizes pagination parameters
   * 4. Applies authorization-based filters
   * 5. Validates and normalizes filter criteria
   * 6. Retrieves tasks from the repository
   * 7. Converts entities to DTOs and returns results
   *
   * @param request - Request object containing user ID, filters, and pagination parameters
   * @param currentUserId - ID of the authenticated user making the request
   * @param currentUserRole - Role of the authenticated user ('ADMIN' or 'USER')
   * @returns Promise resolving to GetUserTasksResult containing tasks and metadata
   * @throws Error if user ID is invalid
   * @throws Error if user lacks permission to view target user's tasks
   * @throws Error if repository operation fails
   * @throws Error if filter validation fails
   */
  async getUserTasks(
    request: GetUserTasksRequest,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<GetUserTasksResult> {
    console.log("GetUserTasksUseCase.getUserTasks called", {
      method: "getUserTasks",
      targetUserId: request.userId,
      currentUserId,
      currentUserRole,
      filters: request.filters,
      page: request.page,
      limit: request.limit,
    });

    // Validate that userId is a valid UUID
    console.log("GetUserTasksUseCase.getUserTasks - Validating user ID", {
      method: "getUserTasks",
      targetUserId: request.userId,
    });
    if (!this.isValidUUID(request.userId)) {
      console.warn("GetUserTasksUseCase.getUserTasks - Invalid user ID", {
        method: "getUserTasks",
        targetUserId: request.userId,
        currentUserId,
      });
      throw new Error("Invalid user ID");
    }

    // Validate authorization
    console.log("GetUserTasksUseCase.getUserTasks - Validating authorization", {
      method: "getUserTasks",
      targetUserId: request.userId,
      currentUserId,
      currentUserRole,
    });
    this.validateAuthorization(request.userId, currentUserId, currentUserRole);

    // Normalize pagination parameters
    const page = Math.max(1, request.page || 1);
    const limit = Math.min(100, Math.max(1, request.limit || 10));
    console.log("GetUserTasksUseCase.getUserTasks - Pagination normalized", {
      method: "getUserTasks",
      originalPage: request.page,
      originalLimit: request.limit,
      normalizedPage: page,
      normalizedLimit: limit,
    });

    // Apply authorization filters based on user role
    console.log(
      "GetUserTasksUseCase.getUserTasks - Applying authorization filters",
      {
        method: "getUserTasks",
        currentUserRole,
        originalFilters: request.filters,
      },
    );
    const authorizedFilters = this.applyAuthorizationFilters(
      request.filters || {},
      currentUserId,
      currentUserRole,
    );

    // Validate filters
    console.log("GetUserTasksUseCase.getUserTasks - Validating filters", {
      method: "getUserTasks",
      authorizedFilters,
    });
    const validatedFilters = this.validateFilters(authorizedFilters);

    // Get tasks from repository
    console.log(
      "GetUserTasksUseCase.getUserTasks - Retrieving tasks from repository",
      {
        method: "getUserTasks",
        validatedFilters,
        page,
        limit,
      },
    );
    const result = await this.taskRepository.findTasks(
      validatedFilters,
      currentUserId,
      currentUserRole,
      page,
      limit,
    );

    if (!result) {
      console.error(
        "GetUserTasksUseCase.getUserTasks - Repository returned null result",
        {
          method: "getUserTasks",
          targetUserId: request.userId,
          currentUserId,
        },
      );
      throw new Error("Error retrieving tasks from repository");
    }

    const { tasks, total } = result;
    console.log(
      "GetUserTasksUseCase.getUserTasks - Tasks retrieved from repository",
      {
        method: "getUserTasks",
        tasksFound: tasks.length,
        total,
      },
    );

    // Convert entities to DTOs
    console.log(
      "GetUserTasksUseCase.getUserTasks - Converting entities to DTOs",
      {
        method: "getUserTasks",
        taskCount: tasks.length,
      },
    );
    const taskData = tasks.map((task) => task.toJSON() as unknown as TaskData);

    const response = {
      tasks: taskData,
      total,
      page,
      limit,
      userId: request.userId,
    };

    console.log("GetUserTasksUseCase.getUserTasks completed", {
      method: "getUserTasks",
      targetUserId: request.userId,
      tasksReturned: taskData.length,
      total,
      page,
      limit,
    });

    return response;
  }

  /**
   * Validates user authorization to view tasks for a specific user.
   * Administrators can view tasks for any user, while regular users can only view their own tasks.
   *
   * @param targetUserId - ID of the user whose tasks are being requested
   * @param currentUserId - ID of the authenticated user making the request
   * @param currentUserRole - Role of the authenticated user ('ADMIN' or 'USER')
   * @throws Error if user lacks permission to view target user's tasks
   */
  private validateAuthorization(
    targetUserId: string,
    currentUserId: string,
    currentUserRole: string,
  ): void {
    console.log("GetUserTasksUseCase.validateAuthorization called", {
      method: "validateAuthorization",
      targetUserId,
      currentUserId,
      currentUserRole,
    });

    // Administrators can view tasks for any user
    if (currentUserRole === "ADMIN") {
      console.log(
        "GetUserTasksUseCase.validateAuthorization - Admin access granted",
        {
          method: "validateAuthorization",
          targetUserId,
          currentUserId,
        },
      );
      return;
    }

    // Regular users can only view their own tasks
    if (targetUserId !== currentUserId) {
      console.warn(
        "GetUserTasksUseCase.validateAuthorization - Authorization failed",
        {
          method: "validateAuthorization",
          targetUserId,
          currentUserId,
          currentUserRole,
          reason: "Regular user attempting to view another user's tasks",
        },
      );
      throw new Error(
        "You don't have permission to view tasks from other users",
      );
    }

    console.log(
      "GetUserTasksUseCase.validateAuthorization - Authorization passed",
      {
        method: "validateAuthorization",
        targetUserId,
        currentUserId,
      },
    );
  }

  /**
   * Applies authorization-based filters according to user role.
   * Regular users cannot filter by other users' tasks, while administrators have full access.
   *
   * @param filters - Original filter criteria
   * @param currentUserId - ID of the authenticated user
   * @param currentUserRole - Role of the authenticated user ('ADMIN' or 'USER')
   * @returns Filtered criteria that respect user permissions
   * @throws Error if user attempts to filter by unauthorized criteria
   */
  private applyAuthorizationFilters(
    filters: GetTasksFilters,
    currentUserId: string,
    currentUserRole: string,
  ): GetTasksFilters {
    console.log("GetUserTasksUseCase.applyAuthorizationFilters called", {
      method: "applyAuthorizationFilters",
      filters,
      currentUserId,
      currentUserRole,
    });

    const authorizedFilters = { ...filters };

    // If user is not ADMIN, apply authorization restrictions
    if (currentUserRole !== "ADMIN") {
      // Regular users cannot filter by other users
      if (filters.assignedTo && filters.assignedTo !== currentUserId) {
        console.warn(
          "GetUserTasksUseCase.applyAuthorizationFilters - Unauthorized assignedTo filter",
          {
            method: "applyAuthorizationFilters",
            requestedAssignedTo: filters.assignedTo,
            currentUserId,
            currentUserRole,
          },
        );
        throw new Error(
          "You don't have permission to view tasks assigned to other users",
        );
      }
      if (filters.createdBy && filters.createdBy !== currentUserId) {
        console.warn(
          "GetUserTasksUseCase.applyAuthorizationFilters - Unauthorized createdBy filter",
          {
            method: "applyAuthorizationFilters",
            requestedCreatedBy: filters.createdBy,
            currentUserId,
            currentUserRole,
          },
        );
        throw new Error(
          "You don't have permission to view tasks created by other users",
        );
      }
    }

    console.log("GetUserTasksUseCase.applyAuthorizationFilters completed", {
      method: "applyAuthorizationFilters",
      originalFilters: filters,
      authorizedFilters,
      currentUserRole,
    });

    return authorizedFilters;
  }

  /**
   * Validates and normalizes input filters.
   * Ensures filter values are valid and converts them to appropriate types.
   *
   * @param filters - Raw filter criteria to validate
   * @returns Validated and normalized filter criteria
   */
  private validateFilters(filters: GetTasksFilters): GetTasksFilters {
    console.log("GetUserTasksUseCase.validateFilters called", {
      method: "validateFilters",
      filters,
    });

    const validated: GetTasksFilters = {};

    // Validate status
    if (
      filters.status &&
      ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(filters.status)
    ) {
      validated.status = filters.status;
      console.log("GetUserTasksUseCase.validateFilters - Status validated", {
        method: "validateFilters",
        status: filters.status,
      });
    } else if (filters.status) {
      console.warn(
        "GetUserTasksUseCase.validateFilters - Invalid status filter",
        {
          method: "validateFilters",
          invalidStatus: filters.status,
        },
      );
    }

    // Validate priority
    if (
      filters.priority &&
      ["LOW", "MEDIUM", "HIGH"].includes(filters.priority)
    ) {
      validated.priority = filters.priority;
      console.log("GetUserTasksUseCase.validateFilters - Priority validated", {
        method: "validateFilters",
        priority: filters.priority,
      });
    } else if (filters.priority) {
      console.warn(
        "GetUserTasksUseCase.validateFilters - Invalid priority filter",
        {
          method: "validateFilters",
          invalidPriority: filters.priority,
        },
      );
    }

    // Validate assignedTo (can be any non-empty string)
    if (filters.assignedTo && filters.assignedTo.trim()) {
      validated.assignedTo = filters.assignedTo;
      console.log(
        "GetUserTasksUseCase.validateFilters - AssignedTo validated",
        {
          method: "validateFilters",
          assignedTo: filters.assignedTo,
        },
      );
    }

    // Validate createdBy (can be any non-empty string)
    if (filters.createdBy && filters.createdBy.trim()) {
      validated.createdBy = filters.createdBy;
      console.log("GetUserTasksUseCase.validateFilters - CreatedBy validated", {
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
      console.log(
        "GetUserTasksUseCase.validateFilters - DueDateFrom validated",
        {
          method: "validateFilters",
          dueDateFrom: filters.dueDateFrom,
        },
      );
    } else if (filters.dueDateFrom) {
      console.warn(
        "GetUserTasksUseCase.validateFilters - Invalid dueDateFrom",
        {
          method: "validateFilters",
          invalidDueDateFrom: filters.dueDateFrom,
        },
      );
    }

    if (filters.dueDateTo && !isNaN(new Date(filters.dueDateTo).getTime())) {
      validated.dueDateTo = new Date(filters.dueDateTo);
      console.log("GetUserTasksUseCase.validateFilters - DueDateTo validated", {
        method: "validateFilters",
        dueDateTo: filters.dueDateTo,
      });
    } else if (filters.dueDateTo) {
      console.warn("GetUserTasksUseCase.validateFilters - Invalid dueDateTo", {
        method: "validateFilters",
        invalidDueDateTo: filters.dueDateTo,
      });
    }

    console.log("GetUserTasksUseCase.validateFilters completed", {
      method: "validateFilters",
      originalFilters: filters,
      validatedFilters: validated,
    });

    return validated;
  }

  /**
   * Validates if a string is a valid UUID format.
   * Uses regex pattern to check UUID v1-v5 format compliance.
   *
   * @param uuid - String to validate as UUID
   * @returns true if the string is a valid UUID, false otherwise
   */
  private isValidUUID(uuid: string): boolean {
    console.log("GetUserTasksUseCase.isValidUUID called", {
      method: "isValidUUID",
      uuid,
    });

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValid = uuidRegex.test(uuid);

    console.log("GetUserTasksUseCase.isValidUUID completed", {
      method: "isValidUUID",
      uuid,
      isValid,
    });

    return isValid;
  }
}
