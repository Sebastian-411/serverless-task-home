import type { TaskData, UpdateTaskData } from "../../entities/task.entity";
import { Task } from "../../entities/task.entity";

/**
 * Filters for task queries with optional criteria.
 * All fields are optional and can be combined for refined searches.
 */
export interface GetTasksFilters {
  /** Task status filter (e.g., 'PENDING', 'IN_PROGRESS', 'COMPLETED') */
  status?: string;
  /** Task priority filter (e.g., 'LOW', 'MEDIUM', 'HIGH') */
  priority?: string;
  /** Filter tasks assigned to a specific user ID */
  assignedTo?: string;
  /** Filter tasks created by a specific user ID */
  createdBy?: string;
  /** Filter tasks with due date from this date (inclusive) */
  dueDateFrom?: Date;
  /** Filter tasks with due date up to this date (inclusive) */
  dueDateTo?: Date;
}

/**
 * Result structure for task queries with pagination metadata.
 * Provides both the task data and pagination information for client consumption.
 */
export interface GetTasksResult {
  /** Array of task data objects */
  tasks: TaskData[];
  /** Total number of tasks matching the filters */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of tasks per page */
  limit: number;
}

/**
 * Port interface for task controller operations.
 * Defines the contract for task management operations including retrieval,
 * updates, and filtering with role-based access control.
 *
 * This interface should be implemented by adapters that handle HTTP requests
 * and coordinate with use cases for task operations.
 */
export interface TaskControllerPort {
  /**
   * Retrieves tasks based on filters and user permissions with pagination support.
   *
   * This method handles the retrieval of tasks with optional filtering criteria.
   * The implementation should respect user permissions - regular users can only
   * see tasks they created or were assigned to them, while administrators can
   * see all tasks.
   *
   * @param filters - Optional filters to apply to the task query (status, priority, assignedTo, createdBy, dueDateFrom, dueDateTo)
   * @param userId - ID of the authenticated user making the request
   * @param userRole - Role of the authenticated user ('ADMIN' or 'USER')
   * @param page - Page number for pagination (optional, defaults to 1)
   * @param limit - Number of tasks per page (optional, defaults to 10)
   * @returns Promise resolving to GetTasksResult containing tasks array and pagination metadata
   * @throws May throw authorization errors if user lacks permissions
   * @throws May throw validation errors if filters contain invalid data
   * @throws May throw database errors if query fails
   */
  getTasks(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
    page?: number,
    limit?: number,
  ): Promise<GetTasksResult>;

  /**
   * Updates an existing task with new data.
   *
   * This method handles the update of task properties. The implementation should
   * verify that the user has permission to update the specific task. Regular users
   * can only update tasks they created, while administrators can update any task.
   *
   * @param id - Unique identifier of the task to update
   * @param data - Partial task data containing the fields to update (title, description, status, priority, dueDate, assignedTo)
   * @param userId - ID of the authenticated user making the update request
   * @param userRole - Role of the authenticated user ('ADMIN' or 'USER')
   * @returns Promise resolving to TaskData of the updated task
   * @throws May throw authorization errors if user lacks permission to update the task
   * @throws May throw validation errors if task data is invalid
   * @throws May throw EntityNotFoundError if task with given ID doesn't exist
   * @throws May throw database errors if update operation fails
   */
  updateTask(
    id: string,
    data: Partial<UpdateTaskData>,
    userId: string,
    userRole: string,
  ): Promise<TaskData>;
}
