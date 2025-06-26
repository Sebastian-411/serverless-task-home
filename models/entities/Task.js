/**
 * Task Entity
 * Data model for tasks with complete validation and business logic
 */

const BaseModel = require('../base/BaseModel');
const ValidationError = require('../validators/ValidationError');
const { TASK_STATUS, TASK_PRIORITY, VALIDATION_RULES } = require('../utils/constants');

class Task extends BaseModel {
  constructor({
    id,
    title,
    description,
    status,
    priority,
    dueDate,
    assignedTo,
    createdBy,
    createdAt,
    updatedAt
  }) {
    super();
    
    // Validate and set properties
    this._setId(id);
    this._setTitle(title);
    this._setDescription(description);
    this._setStatus(status);
    this._setPriority(priority);
    this._setDueDate(dueDate);
    this._setAssignedTo(assignedTo);
    this._setCreatedBy(createdBy);
    this._setTimestamps(createdAt, updatedAt);
  }

  /**
   * Factory method to create a new task with auto-generated ID and timestamps
   * @param {Object} taskData - Task data without id, createdAt, updatedAt
   * @returns {Task}
   */
  static create(taskData) {
    const timestamps = BaseModel.createTimestamps();
    return new Task({
      id: BaseModel.generateId(),
      status: TASK_STATUS.PENDING,
      priority: TASK_PRIORITY.MEDIUM,
      ...taskData,
      ...timestamps
    });
  }

  /**
   * Factory method to create task from existing data
   * @param {Object} taskData - Complete task data
   * @returns {Task}
   */
  static fromObject(taskData) {
    return new Task(taskData);
  }

  /**
   * Sets and validates task ID
   * @private
   * @param {string} id - Task ID
   */
  _setId(id) {
    this._validateUUID(id, 'id');
    this.id = id;
  }

  /**
   * Sets and validates task title
   * @private
   * @param {string} title - Task title
   */
  _setTitle(title) {
    this._validateRequired(title, 'title');
    this._validateLength(title.trim(), VALIDATION_RULES.TASK.TITLE_MIN_LENGTH, VALIDATION_RULES.TASK.TITLE_MAX_LENGTH, 'title');
    this.title = title.trim();
  }

  /**
   * Sets and validates task description
   * @private
   * @param {string} description - Task description
   */
  _setDescription(description) {
    this._validateRequired(description, 'description');
    this._validateLength(description, 1, VALIDATION_RULES.TASK.DESCRIPTION_MAX_LENGTH, 'description');
    this.description = description.trim();
  }

  /**
   * Sets and validates task status
   * @private
   * @param {string} status - Task status
   */
  _setStatus(status) {
    this._validateEnum(status, Object.values(TASK_STATUS), 'status');
    this.status = status;
  }

  /**
   * Sets and validates task priority
   * @private
   * @param {string} priority - Task priority
   */
  _setPriority(priority) {
    this._validateEnum(priority, Object.values(TASK_PRIORITY), 'priority');
    this.priority = priority;
  }

  /**
   * Sets and validates due date
   * @private
   * @param {string|Date} dueDate - Task due date
   */
  _setDueDate(dueDate) {
    this._validateRequired(dueDate, 'dueDate');
    this._validateTimestamp(dueDate, 'dueDate');
    this.dueDate = new Date(dueDate);
  }

  /**
   * Sets assigned user (nullable)
   * @private
   * @param {string} assignedTo - User ID assigned to task
   */
  _setAssignedTo(assignedTo) {
    if (assignedTo) {
      this._validateUUID(assignedTo, 'assignedTo');
    }
    this.assignedTo = assignedTo || null;
  }

  /**
   * Sets and validates creator
   * @private
   * @param {string} createdBy - User ID who created the task
   */
  _setCreatedBy(createdBy) {
    this._validateUUID(createdBy, 'createdBy');
    this.createdBy = createdBy;
  }

  /**
   * Sets and validates timestamps
   * @private
   * @param {string} createdAt - Creation timestamp
   * @param {string} updatedAt - Update timestamp
   */
  _setTimestamps(createdAt, updatedAt) {
    this._validateTimestamp(createdAt, 'createdAt');
    this._validateTimestamp(updatedAt, 'updatedAt');
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Validates the entire task model
   */
  validate() {
    // All validation is done in setters
    return true;
  }

  /**
   * Checks if task is pending
   * @returns {boolean}
   */
  isPending() {
    return this.status === TASK_STATUS.PENDING;
  }

  /**
   * Checks if task is in progress
   * @returns {boolean}
   */
  isInProgress() {
    return this.status === TASK_STATUS.IN_PROGRESS;
  }

  /**
   * Checks if task is completed
   * @returns {boolean}
   */
  isCompleted() {
    return this.status === TASK_STATUS.COMPLETED;
  }

  /**
   * Checks if task is overdue
   * @returns {boolean}
   */
  isOverdue() {
    if (this.isCompleted()) return false;
    return new Date() > this.dueDate;
  }

  /**
   * Checks if task is high priority
   * @returns {boolean}
   */
  isHighPriority() {
    return this.priority === TASK_PRIORITY.HIGH;
  }

  /**
   * Checks if task is assigned to someone
   * @returns {boolean}
   */
  isAssigned() {
    return !!this.assignedTo;
  }

  /**
   * Gets days until due date
   * @returns {number} Days until due (negative if overdue)
   */
  getDaysUntilDue() {
    const now = new Date();
    const diffTime = this.dueDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Assigns task to a user
   * @param {string} userId - User ID to assign task to
   * @returns {Task}
   */
  assignTo(userId) {
    this._setAssignedTo(userId);
    this.updateTimestamp();
    return this;
  }

  /**
   * Unassigns the task
   * @returns {Task}
   */
  unassign() {
    this.assignedTo = null;
    this.updateTimestamp();
    return this;
  }

  /**
   * Starts the task (sets to in progress)
   * @returns {Task}
   */
  start() {
    if (this.status !== TASK_STATUS.PENDING) {
      throw new ValidationError('Task can only be started from pending status');
    }
    this.status = TASK_STATUS.IN_PROGRESS;
    this.updateTimestamp();
    return this;
  }

  /**
   * Completes the task
   * @returns {Task}
   */
  complete() {
    if (this.status === TASK_STATUS.COMPLETED) {
      throw new ValidationError('Task is already completed');
    }
    this.status = TASK_STATUS.COMPLETED;
    this.updateTimestamp();
    return this;
  }

  /**
   * Reopens a completed task
   * @returns {Task}
   */
  reopen() {
    if (this.status !== TASK_STATUS.COMPLETED) {
      throw new ValidationError('Only completed tasks can be reopened');
    }
    this.status = TASK_STATUS.PENDING;
    this.updateTimestamp();
    return this;
  }

  /**
   * Updates task information
   * @param {Object} updates - Fields to update
   * @returns {Task}
   */
  update(updates) {
    const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const setterMethod = `_set${key.charAt(0).toUpperCase() + key.slice(1)}`;
        if (typeof this[setterMethod] === 'function') {
          this[setterMethod](value);
        }
      }
    }
    
    this.updateTimestamp();
    return this;
  }

  /**
   * Converts model to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      assignedTo: this.assignedTo,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create Task from Prisma data
   * @param {Object} prismaTask - Task data from Prisma
   * @returns {Task}
   */
  static fromPrisma(prismaTask) {
    if (!prismaTask) return null;

    return new Task({
      id: prismaTask.id,
      title: prismaTask.title,
      description: prismaTask.description,
      status: prismaTask.status.toLowerCase(), // Convert ENUM to lowercase
      priority: prismaTask.priority.toLowerCase(), // Convert ENUM to lowercase
      dueDate: prismaTask.dueDate,
      assignedTo: prismaTask.assignedToId,
      createdBy: prismaTask.createdById,
      createdAt: prismaTask.createdAt,
      updatedAt: prismaTask.updatedAt
    });
  }

  /**
   * Convert to Prisma format for database operations
   * @returns {Object}
   */
  toPrisma() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status.toUpperCase(), // Convert to ENUM format
      priority: this.priority.toUpperCase(), // Convert to ENUM format
      dueDate: this.dueDate,
      assignedToId: this.assignedTo,
      createdById: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Task; 