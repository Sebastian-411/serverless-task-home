/**
 * Create Task Use Case
 * Handles the business logic for creating new tasks
 */

const TaskDomain = require('../domain/task.entity');
const CustomValidationError = require('../../../shared/domain/exceptions/validation.error');
const { Cache, CacheKeys } = require('../../../shared/cache/cache.service');

class CreateTaskUseCase {
  private taskRepository: any;
  private userRepository: any;

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
      const task = TaskDomain.create({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority ? taskData.priority.toLowerCase() : 'medium',
        dueDate: taskData.dueDate,
        assignedTo: taskData.assignedTo,
        userId: taskData.userId
      });

      // 5. Save task to repository
      const savedTask = await this.taskRepository.create(task.toPrisma());

      // 6. Invalidate related cache entries for data consistency
      console.log('🗑️ Invalidating cache after task creation...');
      this._invalidateTaskCaches(taskData);

      // 7. Return the normalized entity, not the raw database data
      return task.toJSON();

    } catch (error) {
      if (error instanceof CustomValidationError) {
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

    if (taskData.priority && !['low', 'medium', 'high', 'urgent'].includes(taskData.priority.toLowerCase())) {
      errors.push('Priority must be one of: low, medium, high, urgent (case insensitive)');
    }

    if (taskData.dueDate && isNaN(Date.parse(taskData.dueDate))) {
      errors.push('Due date must be a valid date');
    }

    if (errors.length > 0) {
      throw new CustomValidationError(`Task validation failed: ${errors.join(', ')}`, errors);
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
      throw new CustomValidationError(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * Invalidate related cache entries after task creation
   * @private
   * @param {Object} taskData - Task data that was created
   */
  _invalidateTaskCaches(taskData) {
    try {
      // Invalidate general task lists
      Cache.delete(CacheKeys.tasksList());
      Cache.delete(CacheKeys.userTasks(taskData.userId));
      
      // Invalidate assigned user caches if task was assigned
      if (taskData.assignedTo) {
        Cache.delete(CacheKeys.assignedTasks(taskData.assignedTo));
      }
      
      // Invalidate status and priority specific caches
      const status = taskData.status || 'pending';
      const priority = taskData.priority || 'medium';
      Cache.delete(CacheKeys.tasksByStatus(status));
      Cache.delete(CacheKeys.tasksByPriority(priority));
      
      // Invalidate count caches
      Cache.delete(CacheKeys.tasksCount());
      Cache.delete(CacheKeys.tasksCount(taskData.userId));
      
      console.log('✅ Cache invalidated successfully after task creation');
    } catch (error) {
      // Cache invalidation is not critical, just log warning
      console.warn('⚠️ Cache invalidation warning:', error.message);
    }
  }
}

export { CreateTaskUseCase }; 