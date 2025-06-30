import type { Task, TaskData, TaskStatus, TaskPriority } from "../domain";

/**
 * Input data structure for creating a new task.
 * Contains all the necessary information to create a task entity.
 */
export interface CreateTaskInput {
  /** Title of the task - required field */
  title: string;
  /** Description of the task - required field */
  description: string;
  /** Current status of the task - optional, defaults to system default */
  status?: TaskStatus;
  /** Priority level of the task - optional, defaults to system default */
  priority?: TaskPriority;
  /** Due date for task completion - optional */
  dueDate?: Date;
  /** ID of the user assigned to the task - optional */
  assignedTo?: string;
  /** ID of the user creating the task - required field */
  createdBy: string;
}

/**
 * Repository port interface for task creation operations.
 * Defines the contract for creating new task entities in the system.
 */
export interface TaskRepositoryPort {
  /**
   * Creates a new task in the system.
   *
   * @param data - Task creation data containing all required and optional fields
   * @returns Promise resolving to the created Task entity
   * @throws DatabaseError if the task cannot be created
   */
  createTask(data: CreateTaskInput): Promise<Task>;
}

/**
 * Use case for creating new tasks in the system.
 * Handles the business logic for task creation including input validation.
 * Supports creation by both administrators and regular users.
 */
export class CreateTaskUseCase {
  /**
   * Creates a new CreateTaskUseCase instance.
   *
   * @param taskRepository - Repository interface for task data operations
   */
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Creates a new task in the system.
   *
   * This method performs the following steps:
   * 1. Validates required input fields (title and description)
   * 2. Creates the task using the repository
   * 3. Converts the entity to DTO format and returns it
   *
   * Both administrators and regular users can create tasks.
   * The createdBy field in the input determines task ownership.
   *
   * @param input - Task creation data containing all required and optional fields
   * @param userRole - Role of the user creating the task ('ADMIN' or 'USER')
   * @returns Promise resolving to TaskData representing the created task
   * @throws Error if required fields (title or description) are missing
   * @throws DatabaseError if repository operation fails
   */
  async createTask(
    input: CreateTaskInput,
    userRole: string,
  ): Promise<TaskData> {
    console.log("CreateTaskUseCase.createTask called", {
      method: "createTask",
      userRole,
      createdBy: input.createdBy,
      assignedTo: input.assignedTo,
      hasTitle: !!input.title,
      hasDescription: !!input.description,
      hasStatus: !!input.status,
      hasPriority: !!input.priority,
      hasDueDate: !!input.dueDate,
    });

    // Basic validations
    console.log("CreateTaskUseCase.createTask - Validating input fields", {
      method: "createTask",
      titleLength: input.title?.length || 0,
      descriptionLength: input.description?.length || 0,
    });

    if (!input.title || !input.description) {
      console.warn("CreateTaskUseCase.createTask - Validation failed", {
        method: "createTask",
        userRole,
        createdBy: input.createdBy,
        missingTitle: !input.title,
        missingDescription: !input.description,
        reason: "Required fields (title or description) are missing",
      });
      throw new Error("Required fields are missing");
    }

    console.log("CreateTaskUseCase.createTask - Input validation passed", {
      method: "createTask",
      userRole,
      createdBy: input.createdBy,
    });

    // Create task
    console.log("CreateTaskUseCase.createTask - Creating task in repository", {
      method: "createTask",
      createdBy: input.createdBy,
      assignedTo: input.assignedTo,
    });

    const task = await this.taskRepository.createTask(input);

    console.log("CreateTaskUseCase.createTask - Task created successfully", {
      method: "createTask",
      taskId: task.id,
      createdBy: input.createdBy,
      assignedTo: input.assignedTo,
    });

    console.log("CreateTaskUseCase.createTask completed", {
      method: "createTask",
      taskId: task.id,
      userRole,
      createdBy: input.createdBy,
      taskCreated: true,
    });

    return task.toJSON() as unknown as TaskData;
  }
}
