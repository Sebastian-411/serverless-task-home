/**
 * Create Task Use Case
 * Handles the business logic for creating new tasks
 */

const Task = require('../domain/task.entity');
const ValidationError = require('../../../shared/domain/exceptions/validation.error');

class CreateTaskUseCase {
  constructor(taskRepository, userRepository) {
    this.taskRepository = taskRepository;
    this.userRepository = userRepository;
  }

  /**
   * Execute the create task use case
   * @param {Object} taskData - Task creation data
   * @param {string} taskData.title - Task title
   * @param {string} taskData.description - Task description (optional)
   * @param {string} taskData.priority - Task priority
   * @param {string} taskData.dueDate - Due date (optional)
   * @param {string} taskData.assignedTo - User to assign task to (optional)
   * @param {string} taskData.userId - User creating the task
   * @returns {Promise<Task>} Created task
   */
  async execute(taskData) {
    try {
      // 1. Validate input data
      await this._validateInput(taskData);

      // 2. Verify user exists
      await this._verifyUserExists(taskData.userId);

      // 3. Verify assigned user exists if provided
      if (taskData.assignedTo) {
        await this._verifyUserExists(taskData.assignedTo);
      }

      // 4. Create task entity
      const task = Task.create({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate,
        assignedTo: taskData.assignedTo,
        userId: taskData.userId
      });

      // 5. Save task to repository
      const savedTask = await this.taskRepository.create(task);

      return savedTask;

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  /**
   * Validate input data
   * @private
   * @param {Object} taskData - Task data to validate
   */
  async _validateInput(taskData) {
    const errors = [];

    if (!taskData.title || typeof taskData.title !== 'string') {
      errors.push('Title is required and must be a string');
    }

    if (!taskData.userId || typeof taskData.userId !== 'string') {
      errors.push('User ID is required and must be a string');
    }

    if (taskData.priority && !['low', 'medium', 'high', 'urgent'].includes(taskData.priority)) {
      errors.push('Priority must be one of: low, medium, high, urgent');
    }

    if (taskData.dueDate && isNaN(Date.parse(taskData.dueDate))) {
      errors.push('Due date must be a valid date');
    }

    if (errors.length > 0) {
      throw new ValidationError('Task validation failed', errors);
    }
  }

  /**
   * Verify that a user exists
   * @private
   * @param {string} userId - User ID to verify
   */
  async _verifyUserExists(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ValidationError(`User with ID ${userId} not found`);
    }
    return user;
  }
}

module.exports = CreateTaskUseCase; 