import { BaseEntity } from "../../../common/domain/base.entity";

/**
 * Enumeration of possible task statuses.
 * Represents the current state of a task in its lifecycle.
 */
export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

/**
 * Enumeration of possible task priorities.
 * Represents the importance level of a task.
 */
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

/**
 * Complete task data structure.
 * Contains all properties of a task entity including metadata.
 */
export interface TaskData {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data structure for creating a new task.
 * Contains required and optional fields for task creation.
 */
export interface CreateTaskData {
  title: string;
  description: string;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  createdBy: string;
}

/**
 * Data structure for updating an existing task.
 * All fields are optional to allow partial updates.
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
}

/**
 * Task domain entity representing a work item or assignment.
 * Encapsulates task business logic, validation, and state management.
 * Extends BaseEntity to inherit common entity functionality.
 */
export class Task extends BaseEntity {
  private _title: string;
  private _description: string;
  private _status: TaskStatus;
  private _priority: TaskPriority;
  private _dueDate?: string;
  private _assignedTo?: string;
  private _createdBy: string;

  /**
   * Creates a new Task instance from existing data.
   *
   * @param data - Complete task data including all required fields
   */
  constructor(data: TaskData) {
    super(data.id);
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this._title = data.title;
    this._description = data.description;
    this._status = data.status;
    this._priority = data.priority;
    this._dueDate = data.dueDate;
    this._assignedTo = data.assignedTo;
    this._createdBy = data.createdBy;
  }

  // Getters
  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get status(): TaskStatus {
    return this._status;
  }

  get priority(): TaskPriority {
    return this._priority;
  }

  get dueDate(): string | undefined {
    return this._dueDate;
  }

  get assignedTo(): string | undefined {
    return this._assignedTo;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  /**
   * Checks if the task can be assigned to a specific user.
   * Completed tasks cannot be reassigned.
   *
   * @param userId - ID of the user to check assignment possibility for
   * @returns true if the task can be assigned, false otherwise
   */
  canBeAssignedTo(userId: string): boolean {
    console.log("Task.canBeAssignedTo called", {
      method: "canBeAssignedTo",
      taskId: this.id,
      userId,
      currentStatus: this._status,
    });

    const canBeAssigned = this._status !== TaskStatus.COMPLETED;

    console.log("Task.canBeAssignedTo completed", {
      method: "canBeAssignedTo",
      taskId: this.id,
      canBeAssigned,
      reason: canBeAssigned ? "Task not completed" : "Task is completed",
    });

    return canBeAssigned;
  }

  /**
   * Checks if a user has permission to update this task.
   * Users can update tasks they created, are assigned to, or if they are admins.
   *
   * @param userId - ID of the user requesting update permission
   * @param userRole - Role of the user requesting update permission
   * @returns true if the user can update the task, false otherwise
   */
  canBeUpdatedBy(userId: string, userRole: string): boolean {
    console.log("Task.canBeUpdatedBy called", {
      method: "canBeUpdatedBy",
      taskId: this.id,
      userId,
      userRole,
      taskCreatedBy: this._createdBy,
      taskAssignedTo: this._assignedTo,
    });

    const canUpdate =
      this._createdBy === userId ||
      this._assignedTo === userId ||
      userRole === "ADMIN";

    console.log("Task.canBeUpdatedBy completed", {
      method: "canBeUpdatedBy",
      taskId: this.id,
      canUpdate,
      reason: canUpdate ? "User has permission" : "User lacks permission",
    });

    return canUpdate;
  }

  /**
   * Checks if a user has permission to view this task.
   * Users can view tasks they created, are assigned to, or if they are admins.
   *
   * @param userId - ID of the user requesting view permission
   * @param userRole - Role of the user requesting view permission
   * @returns true if the user can view the task, false otherwise
   */
  canBeViewedBy(userId: string, userRole: string): boolean {
    console.log("Task.canBeViewedBy called", {
      method: "canBeViewedBy",
      taskId: this.id,
      userId,
      userRole,
      taskCreatedBy: this._createdBy,
      taskAssignedTo: this._assignedTo,
    });

    const canView =
      this._createdBy === userId ||
      this._assignedTo === userId ||
      userRole === "ADMIN";

    console.log("Task.canBeViewedBy completed", {
      method: "canBeViewedBy",
      taskId: this.id,
      canView,
      reason: canView ? "User has permission" : "User lacks permission",
    });

    return canView;
  }

  /**
   * Checks if the task is overdue based on its due date and status.
   * Completed tasks are never considered overdue.
   *
   * @returns true if the task is overdue, false otherwise
   */
  isOverdue(): boolean {
    console.log("Task.isOverdue called", {
      method: "isOverdue",
      taskId: this.id,
      dueDate: this._dueDate,
      currentStatus: this._status,
    });

    if (!this._dueDate) {
      console.log("Task.isOverdue completed", {
        method: "isOverdue",
        taskId: this.id,
        isOverdue: false,
        reason: "No due date set",
      });
      return false;
    }

    const isOverdue =
      new Date() > new Date(this._dueDate) &&
      this._status !== TaskStatus.COMPLETED;

    console.log("Task.isOverdue completed", {
      method: "isOverdue",
      taskId: this.id,
      isOverdue,
      reason: isOverdue
        ? "Past due date and not completed"
        : "Not overdue or completed",
    });

    return isOverdue;
  }

  /**
   * Assigns the task to a specific user.
   * Cannot assign completed tasks.
   *
   * @param userId - ID of the user to assign the task to
   * @throws Error if the task cannot be assigned (e.g., when completed)
   */
  assignTo(userId: string): void {
    console.log("Task.assignTo called", {
      method: "assignTo",
      taskId: this.id,
      userId,
      currentStatus: this._status,
    });

    if (!this.canBeAssignedTo(userId)) {
      console.error("Task.assignTo failed", {
        method: "assignTo",
        taskId: this.id,
        userId,
        error: "Task cannot be assigned when completed",
      });
      throw new Error("Task cannot be assigned when completed");
    }

    this._assignedTo = userId;
    this.updateTimestamp();

    console.log("Task.assignTo completed", {
      method: "assignTo",
      taskId: this.id,
      assignedTo: userId,
    });
  }

  /**
   * Updates the task status.
   * Automatically updates the timestamp when status changes.
   *
   * @param status - New status for the task
   */
  updateStatus(status: TaskStatus): void {
    console.log("Task.updateStatus called", {
      method: "updateStatus",
      taskId: this.id,
      newStatus: status,
      currentStatus: this._status,
    });

    this._status = status;
    this.updateTimestamp();

    console.log("Task.updateStatus completed", {
      method: "updateStatus",
      taskId: this.id,
      status: this._status,
    });
  }

  /**
   * Updates the task priority.
   * Automatically updates the timestamp when priority changes.
   *
   * @param priority - New priority for the task
   */
  updatePriority(priority: TaskPriority): void {
    console.log("Task.updatePriority called", {
      method: "updatePriority",
      taskId: this.id,
      newPriority: priority,
      currentPriority: this._priority,
    });

    this._priority = priority;
    this.updateTimestamp();

    console.log("Task.updatePriority completed", {
      method: "updatePriority",
      taskId: this.id,
      priority: this._priority,
    });
  }

  /**
   * Updates multiple task details at once.
   * Only updates fields that are provided in the data object.
   * Automatically updates the timestamp when any field changes.
   *
   * @param data - Partial task data containing fields to update
   */
  updateDetails(data: Partial<UpdateTaskData>): void {
    console.log("Task.updateDetails called", {
      method: "updateDetails",
      taskId: this.id,
      updateData: data,
    });

    if (data.title !== undefined) this._title = data.title;
    if (data.description !== undefined) this._description = data.description;
    if (data.status !== undefined) this._status = data.status;
    if (data.priority !== undefined) this._priority = data.priority;
    if (data.dueDate !== undefined) this._dueDate = data.dueDate;
    if (data.assignedTo !== undefined) this._assignedTo = data.assignedTo;
    this.updateTimestamp();

    console.log("Task.updateDetails completed", {
      method: "updateDetails",
      taskId: this.id,
      fieldsUpdated: Object.keys(data).filter(
        (key) => data[key as keyof UpdateTaskData] !== undefined,
      ),
    });
  }

  /**
   * Validates the task entity data.
   * Checks all required fields, data types, and business rules.
   *
   * @throws ValidationError if any validation fails
   */
  validate(): void {
    console.log("Task.validate called", {
      method: "validate",
      taskId: this.id,
    });

    try {
      this._validateRequired(this._title, "title");
      this._validateLength(this._title, 1, 255, "title");
      this._validateRequired(this._description, "description");
      this._validateEnum(this._status, Object.values(TaskStatus), "status");
      this._validateEnum(
        this._priority,
        Object.values(TaskPriority),
        "priority",
      );
      if (this._dueDate) this._validateTimestamp(this._dueDate, "dueDate");
      this._validateUUID(this._createdBy, "createdBy");
      if (this._assignedTo) this._validateUUID(this._assignedTo, "assignedTo");

      console.log("Task.validate completed", {
        method: "validate",
        taskId: this.id,
        validationPassed: true,
      });
    } catch (error) {
      console.error("Task.validate failed", {
        method: "validate",
        taskId: this.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Converts the task entity to a plain object for serialization.
   *
   * @returns Object containing all task properties
   */
  toJSON(): Record<string, unknown> {
    console.log("Task.toJSON called", {
      method: "toJSON",
      taskId: this.id,
    });

    const json = {
      id: this.id,
      title: this._title,
      description: this._description,
      status: this._status,
      priority: this._priority,
      dueDate: this._dueDate,
      assignedTo: this._assignedTo,
      createdBy: this._createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    console.log("Task.toJSON completed", {
      method: "toJSON",
      taskId: this.id,
    });

    return json;
  }

  /**
   * Factory method to create a new Task instance.
   * Sets default values and generates timestamps.
   *
   * @param data - Data required to create a new task
   * @returns New Task instance with generated ID and timestamps
   */
  static create(data: CreateTaskData): Task {
    console.log("Task.create called", {
      method: "create",
      createData: {
        title: data.title,
        priority: data.priority,
        assignedTo: data.assignedTo,
        createdBy: data.createdBy,
      },
    });

    const now = new Date().toISOString();
    const task = new Task({
      id: BaseEntity.generateId(),
      title: data.title,
      description: data.description,
      status: TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      dueDate: data.dueDate,
      assignedTo: data.assignedTo,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    console.log("Task.create completed", {
      method: "create",
      taskId: task.id,
      status: task.status,
      priority: task.priority,
    });

    return task;
  }
}
