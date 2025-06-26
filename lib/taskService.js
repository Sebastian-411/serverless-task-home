/**
 * Task Service for Vercel Functions
 * Handles all task-related database operations
 */

const { getPrismaClient, formatTaskFromDB, formatTaskForDB } = require('./prisma');
const { Task } = require('../models');

/**
 * Creates a new task in the database
 * @param {Object} taskData - Task data to create
 * @returns {Promise<Object>}
 */
async function createTask(taskData) {
  const prisma = getPrismaClient();
  
  try {
    // Validate with our Task model first
    const taskModel = Task.create(taskData);
    
    // Convert to Prisma format and save
    const prismaData = formatTaskForDB(taskModel);
    const createdTask = await prisma.task.create({
      data: prismaData,
      include: {
        assignedTo: true,
        createdBy: true
      }
    });

    return {
      success: true,
      task: formatTaskFromDB(createdTask)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Finds a task by ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>}
 */
async function findTaskById(taskId) {
  const prisma = getPrismaClient();
  
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
        createdBy: true
      }
    });

    return {
      success: true,
      task: task ? formatTaskFromDB(task) : null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Updates a task
 * @param {string} taskId - Task ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>}
 */
async function updateTask(taskId, updateData) {
  const prisma = getPrismaClient();
  
  try {
    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return {
        success: false,
        error: 'Task not found'
      };
    }

    // Create updated task model for validation
    const currentTaskData = formatTaskFromDB(existingTask);
    const taskModel = Task.fromObject(currentTaskData);
    taskModel.update(updateData);

    // Convert to Prisma format and update
    const prismaData = formatTaskForDB(taskModel);
    delete prismaData.id; // Don't update ID
    
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: prismaData,
      include: {
        assignedTo: true,
        createdBy: true
      }
    });

    return {
      success: true,
      task: formatTaskFromDB(updatedTask)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Deletes a task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>}
 */
async function deleteTask(taskId) {
  const prisma = getPrismaClient();
  
  try {
    await prisma.task.delete({
      where: { id: taskId }
    });

    return {
      success: true,
      message: 'Task deleted successfully'
    };
  } catch (error) {
    if (error.code === 'P2025') {
      return {
        success: false,
        error: 'Task not found'
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gets all tasks with filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
async function getAllTasks(options = {}) {
  const prisma = getPrismaClient();
  
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      assignedTo, 
      createdBy,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    const skip = (page - 1) * limit;

    const where = {};
    
    if (status) {
      where.status = status.toUpperCase();
    }
    
    if (priority) {
      where.priority = priority.toUpperCase();
    }
    
    if (assignedTo) {
      where.assignedToId = assignedTo;
    }
    
    if (createdBy) {
      where.createdById = createdBy;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          assignedTo: true,
          createdBy: true
        }
      }),
      prisma.task.count({ where })
    ]);

    return {
      success: true,
      tasks: tasks.map(formatTaskFromDB),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Assigns a task to a user
 * @param {string} taskId - Task ID
 * @param {string} userId - User ID to assign
 * @returns {Promise<Object>}
 */
async function assignTask(taskId, userId) {
  const prisma = getPrismaClient();
  
  try {
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        assignedToId: userId,
        updatedAt: new Date()
      },
      include: {
        assignedTo: true,
        createdBy: true
      }
    });

    return {
      success: true,
      task: formatTaskFromDB(updatedTask)
    };
  } catch (error) {
    if (error.code === 'P2025') {
      return {
        success: false,
        error: 'Task not found'
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gets overdue tasks
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
async function getOverdueTasks(options = {}) {
  const prisma = getPrismaClient();
  
  try {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where = {
      dueDate: { lt: new Date() },
      status: { not: 'COMPLETED' }
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          assignedTo: true,
          createdBy: true
        }
      }),
      prisma.task.count({ where })
    ]);

    return {
      success: true,
      tasks: tasks.map(formatTaskFromDB),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createTask,
  findTaskById,
  updateTask,
  deleteTask,
  getAllTasks,
  assignTask,
  getOverdueTasks
}; 