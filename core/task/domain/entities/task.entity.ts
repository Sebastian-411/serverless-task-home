import { BaseEntity } from "../../../common/domain/base.entity";

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

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

export interface CreateTaskData {
  title: string;
  description: string;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  createdBy: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
}

export class Task extends BaseEntity {
  private _title: string;
  private _description: string;
  private _status: TaskStatus;
  private _priority: TaskPriority;
  private _dueDate?: string;
  private _assignedTo?: string;
  private _createdBy: string;

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

  // Business logic methods
  canBeAssignedTo(userId: string): boolean {
    return this._status !== TaskStatus.COMPLETED;
  }

  canBeUpdatedBy(userId: string, userRole: string): boolean {
    return (
      this._createdBy === userId ||
      this._assignedTo === userId ||
      userRole === "ADMIN"
    );
  }

  canBeViewedBy(userId: string, userRole: string): boolean {
    return (
      this._createdBy === userId ||
      this._assignedTo === userId ||
      userRole === "ADMIN"
    );
  }

  isOverdue(): boolean {
    if (!this._dueDate) return false;
    return (
      new Date() > new Date(this._dueDate) &&
      this._status !== TaskStatus.COMPLETED
    );
  }

  // State change methods
  assignTo(userId: string): void {
    if (!this.canBeAssignedTo(userId)) {
      throw new Error("Task cannot be assigned when completed");
    }
    this._assignedTo = userId;
    this.updateTimestamp();
  }

  updateStatus(status: TaskStatus): void {
    this._status = status;
    this.updateTimestamp();
  }

  updatePriority(priority: TaskPriority): void {
    this._priority = priority;
    this.updateTimestamp();
  }

  updateDetails(data: Partial<UpdateTaskData>): void {
    if (data.title !== undefined) this._title = data.title;
    if (data.description !== undefined) this._description = data.description;
    if (data.status !== undefined) this._status = data.status;
    if (data.priority !== undefined) this._priority = data.priority;
    if (data.dueDate !== undefined) this._dueDate = data.dueDate;
    if (data.assignedTo !== undefined) this._assignedTo = data.assignedTo;
    this.updateTimestamp();
  }

  // Validación de la entidad
  validate(): void {
    this._validateRequired(this._title, "title");
    this._validateLength(this._title, 1, 255, "title");
    this._validateRequired(this._description, "description");
    this._validateEnum(this._status, Object.values(TaskStatus), "status");
    this._validateEnum(this._priority, Object.values(TaskPriority), "priority");
    if (this._dueDate) this._validateTimestamp(this._dueDate, "dueDate");
    this._validateUUID(this._createdBy, "createdBy");
    if (this._assignedTo) this._validateUUID(this._assignedTo, "assignedTo");
  }

  // Serialización
  toJSON(): Record<string, unknown> {
    return {
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
  }

  static create(data: CreateTaskData): Task {
    const now = new Date().toISOString();
    return new Task({
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
  }
}
