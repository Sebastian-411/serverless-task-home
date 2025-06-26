/**
 * Task Service
 * Handles all task-related database operations
 */

const { getPrismaClient, DatabaseUtils } = require('../database/prisma');
const { Task } = require('../../models');

/**
 * Task Service class
 * Provides high-level operations for task management
 */
class TaskService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Get all tasks with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tasks with pagination info
   */
  async getTasks(options = {}) {
    const {
      page = 1,
      limit = 10,
      status = null,
      priority = null,
      assignedTo = null,
      createdBy = null,
      search = '',
      includeUser = true,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const { skip, take } = DatabaseUtils.getPaginationParams(page, limit);
    
    const where = {
      ...(status && { status: status.toUpperCase() }),
      ...(priority && { priority: priority.toUpperCase() }),
      ...(assignedTo && { assignedTo }),
      ...(createdBy && { createdBy }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const orderBy = { [sortBy]: sortOrder };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: includeUser ? {
          assignedUser: true,
          createdByUser: true
        } : {},
        orderBy,
        skip,
        take
      }),
      this.prisma.task.count({ where })
    ]);

    return DatabaseUtils.buildPaginationResponse(
      tasks.map(task => Task.fromPrisma(task)),
      total,
      page,
      limit
    );
  }

  /**
   * Get task by ID
   * @param {string} id - Task ID
   * @param {boolean} includeUser - Include user data
   * @returns {Promise<Task|null>} Task instance or null
   */
  async getTaskById(id, includeUser = true) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: includeUser ? {
        assignedUser: true,
        createdByUser: true
      } : {}
    });

    return task ? Task.fromPrisma(task) : null;
  }

  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Task>} Created task instance
   */
  async createTask(taskData) {
    // Create Task model instance for validation
    const task = Task.create(taskData);
    
    const createdTask = await this.prisma.task.create({
      data: task.toPrisma(),
      include: {
        assignedUser: true,
        createdByUser: true
      }
    });

    return Task.fromPrisma(createdTask);
  }

  /**
   * Update task information
   * @param {string} id - Task ID
   * @param {Object} updates - Update data
   * @returns {Promise<Task>} Updated task instance
   */
  async updateTask(id, updates) {
    const existingTask = await this.getTaskById(id);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    // Apply updates to model for validation
    const updatedTask = existingTask.update(updates);
    
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...updatedTask.toPrisma(),
        updatedAt: new Date()
      },
      include: {
        assignedUser: true,
        createdByUser: true
      }
    });

    return Task.fromPrisma(task);
  }

  /**
   * Delete task
   * @param {string} id - Task ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTask(id) {
    const task = await this.getTaskById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    await this.prisma.task.delete({
      where: { id }
    });

    return true;
  }

  /**
   * Assign task to user
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @returns {Promise<Task>} Updated task
   */
  async assignTask(taskId, userId) {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { 
        assignedTo: userId,
        updatedAt: new Date()
      },
      include: {
        assignedUser: true,
        createdByUser: true
      }
    });

    return Task.fromPrisma(updatedTask);
  }

  /**
   * Unassign task from user
   * @param {string} taskId - Task ID
   * @returns {Promise<Task>} Updated task
   */
  async unassignTask(taskId) {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { 
        assignedTo: null,
        updatedAt: new Date()
      },
      include: {
        assignedUser: true,
        createdByUser: true
      }
    });

    return Task.fromPrisma(updatedTask);
  }

  /**
   * Update task status
   * @param {string} taskId - Task ID
   * @param {string} status - New status
   * @returns {Promise<Task>} Updated task
   */
  async updateTaskStatus(taskId, status) {
    return await this.updateTask(taskId, { status });
  }

  /**
   * Update task priority
   * @param {string} taskId - Task ID
   * @param {string} priority - New priority
   * @returns {Promise<Task>} Updated task
   */
  async updateTaskPriority(taskId, priority) {
    return await this.updateTask(taskId, { priority });
  }

  /**
   * Get tasks assigned to user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's tasks with pagination
   */
  async getTasksByUser(userId, options = {}) {
    return await this.getTasks({
      ...options,
      assignedTo: userId
    });
  }

  /**
   * Get tasks created by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's created tasks with pagination
   */
  async getTasksCreatedByUser(userId, options = {}) {
    return await this.getTasks({
      ...options,
      createdBy: userId
    });
  }

  /**
   * Get overdue tasks
   * @param {Object} options - Query options
   * @returns {Promise<Task[]>} Overdue tasks
   */
  async getOverdueTasks(options = {}) {
    const { limit = 50, includeCompleted = false } = options;
    
    const where = {
      dueDate: {
        lt: new Date()
      },
      ...(includeCompleted ? {} : {
        status: {
          not: 'COMPLETED'
        }
      })
    };

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignedUser: true,
        createdByUser: true
      },
      orderBy: { dueDate: 'asc' },
      take: limit
    });

    return tasks.map(task => Task.fromPrisma(task));
  }

  /**
   * Get tasks by status
   * @param {string} status - Task status
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tasks with pagination
   */
  async getTasksByStatus(status, options = {}) {
    return await this.getTasks({
      ...options,
      status
    });
  }

  /**
   * Get tasks by priority
   * @param {string} priority - Task priority
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tasks with pagination
   */
  async getTasksByPriority(priority, options = {}) {
    return await this.getTasks({
      ...options,
      priority
    });
  }

  /**
   * Search tasks
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Search results with pagination
   */
  async searchTasks(query, options = {}) {
    return await this.getTasks({
      ...options,
      search: query
    });
  }

  /**
   * Get task statistics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Task statistics
   */
  async getTaskStats(filters = {}) {
    const { assignedTo, createdBy } = filters;
    
    const baseWhere = {
      ...(assignedTo && { assignedTo }),
      ...(createdBy && { createdBy })
    };

    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      highPriorityTasks,
      overdueTasks
    ] = await Promise.all([
      this.prisma.task.count({ where: baseWhere }),
      this.prisma.task.count({ 
        where: { ...baseWhere, status: 'PENDING' } 
      }),
      this.prisma.task.count({ 
        where: { ...baseWhere, status: 'IN_PROGRESS' } 
      }),
      this.prisma.task.count({ 
        where: { ...baseWhere, status: 'COMPLETED' } 
      }),
      this.prisma.task.count({ 
        where: { ...baseWhere, priority: 'HIGH' } 
      }),
      this.prisma.task.count({ 
        where: { 
          ...baseWhere, 
          dueDate: { lt: new Date() },
          status: { not: 'COMPLETED' }
        } 
      })
    ]);

    return {
      total: totalTasks,
      byStatus: {
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks
      },
      highPriority: highPriorityTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0
    };
  }

  /**
   * Bulk update tasks
   * @param {Array} taskIds - Array of task IDs
   * @param {Object} updates - Updates to apply
   * @returns {Promise<number>} Number of updated tasks
   */
  async bulkUpdateTasks(taskIds, updates) {
    if (!taskIds || taskIds.length === 0) {
      return 0;
    }

    // Validate updates with our model
    const sampleTask = Task.create({
      title: 'Sample',
      description: 'Sample',
      status: 'pending',
      priority: 'medium',
      createdBy: 'sample-user'
    });

    const validatedUpdates = sampleTask.update(updates);
    
    const result = await this.prisma.task.updateMany({
      where: {
        id: {
          in: taskIds
        }
      },
      data: {
        ...validatedUpdates.toPrisma(),
        updatedAt: new Date()
      }
    });

    return result.count;
  }
}

// Export singleton instance
const taskService = new TaskService();

module.exports = taskService; 