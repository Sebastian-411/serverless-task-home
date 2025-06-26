/**
 * Task Model
 * Data model for system tasks with complete validation and business logic
 */

const BaseModel = require('./BaseModel');
const ValidationError = require('./ValidationError');
const { TASK_STATUS, TASK_PRIORITY } = require('./constants');

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
      status: TASK_STATUS.PENDING, // Default status
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
    if (title.trim().length < 3) {
      throw ValidationError.invalidFormat('title', 'at least 3 characters', title);
    }
    if (title.trim().length > 200) {
      throw ValidationError.invalidFormat('title', 'maximum 200 characters', title);
    }
    this.title = title.trim();
  }

  /**
   * Sets and validates task description
   * @private
   * @param {string} description - Task description
   */
  _setDescription(description) {
    this._validateRequired(description, 'description');
    if (description.trim().length < 10) {
      throw ValidationError.invalidFormat('description', 'at least 10 characters', description);
    }
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
   * @param {string} dueDate - Due date timestamp
   */
  _setDueDate(dueDate) {
    this._validateTimestamp(dueDate, 'dueDate');
    
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    
    if (dueDateObj < now) {
      throw ValidationError.invalidFormat('dueDate', 'future date', dueDate);
    }
    
    this.dueDate = dueDate;
  }

  /**
   * Sets and validates assigned user
   * @private
   * @param {string|null} assignedTo - Assigned user ID (nullable)
   */
  _setAssignedTo(assignedTo) {
    if (assignedTo !== null && assignedTo !== undefined) {
      this._validateUUID(assignedTo, 'assignedTo');
    }
    this.assignedTo = assignedTo || null;
  }

  /**
   * Sets and validates creator
   * @private
   * @param {string} createdBy - Creator user ID
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
   * Checks if task is assigned to someone
   * @returns {boolean}
   */
  isAssigned() {
    return this.assignedTo !== null;
  }

  /**
   * Checks if task is overdue
   * @returns {boolean}
   */
  isOverdue() {
    if (this.isCompleted()) return false;
    return new Date(this.dueDate) < new Date();
  }

  /**
   * Checks if task is high priority
   * @returns {boolean}
   */
  isHighPriority() {
    return this.priority === TASK_PRIORITY.HIGH;
  }

  /**
   * Gets days until due date
   * @returns {number}
   */
  getDaysUntilDue() {
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - now;
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
   * Unassigns task from current user
   * @returns {Task}
   */
  unassign() {
    this.assignedTo = null;
    this.updateTimestamp();
    return this;
  }

  /**
   * Starts the task (sets status to in_progress)
   * @returns {Task}
   */
  start() {
    if (this.isCompleted()) {
      throw new Error('Cannot start a completed task');
    }
    this._setStatus(TASK_STATUS.IN_PROGRESS);
    this.updateTimestamp();
    return this;
  }

  /**
   * Completes the task
   * @returns {Task}
   */
  complete() {
    this._setStatus(TASK_STATUS.COMPLETED);
    this.updateTimestamp();
    return this;
  }

  /**
   * Resets task to pending status
   * @returns {Task}
   */
  reset() {
    this._setStatus(TASK_STATUS.PENDING);
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
  toObject() {
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
   * Converts model to summary object (basic info only)
   * @returns {Object}
   */
  toSummary() {
    return {
      id: this.id,
      title: this.title,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      isOverdue: this.isOverdue(),
      daysUntilDue: this.getDaysUntilDue()
    };
  }
}

module.exports = Task; 