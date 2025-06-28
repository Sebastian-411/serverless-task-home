// Task Repository Prisma Implementation
import { PrismaClient } from '@prisma/client';

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  userId: string;
  assignedTo?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskData {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  userId: string;
  assignedTo?: string;
  completedAt?: Date;
}

export interface TaskRepository {
  create(task: CreateTaskData): Promise<TaskData>;
  findById(id: string): Promise<TaskData | null>;
  findAll(): Promise<TaskData[]>;
  findByUserId(userId: string): Promise<TaskData[]>;
  findByAssignedTo(userId: string): Promise<TaskData[]>;
  update(id: string, data: Partial<CreateTaskData>): Promise<TaskData>;
  delete(id: string): Promise<void>;
  // Performance optimized methods
  countByStatus(status: string): Promise<number>;
  countByUser(userId: string): Promise<number>;
  findByStatusAndPriority(status: string, priority: string): Promise<TaskData[]>;
  findRecentTasks(limit?: number): Promise<TaskData[]>;
  findOverdueTasks(): Promise<TaskData[]>;
  // ULTRA-FAST assignment-specific methods
  findByIdForAssignment(id: string): Promise<TaskData | null>;
  updateAssignment(id: string, assignedTo: string): Promise<TaskData>;
  existsTaskAndUser(taskId: string, userId: string): Promise<{ taskExists: boolean; userExists: boolean }>;
}

export class TaskRepositoryPrisma implements TaskRepository {
  constructor(private prisma: PrismaClient) {}

  async create(task: CreateTaskData): Promise<TaskData> {
    try {
      const createdTask = await this.prisma.task.create({
        data: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          userId: task.userId,
          assignedTo: task.assignedTo,
          completedAt: task.completedAt,
        },
        include: {
          user: true,
          assignedToUser: true,
        },
      });

      return this.mapPrismaToTask(createdTask);
    } catch (error) {
      console.error('Error creating task in database:', error);
      throw new Error('Error creating task');
    }
  }

  async findById(id: string): Promise<TaskData | null> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id },
        include: {
          user: true,
          assignedToUser: true,
        },
      });

      return task ? this.mapPrismaToTask(task) : null;
    } catch (error) {
      console.error('Error finding task by ID:', error);
      throw new Error('Error finding task');
    }
  }

  async findAll(): Promise<TaskData[]> {
    try {
      console.log('🔍 Executing optimized findAll query with indexes...');
      const startTime = Date.now();
      
      const tasks = await this.prisma.task.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignedToUser: {
            select: { id: true, name: true, email: true, role: true }
          },
        },
        orderBy: [
          { createdAt: 'desc' }, // Uses index on createdAt
        ],
      });

      const queryTime = Date.now() - startTime;
      console.log(`⚡ Database query completed in ${queryTime}ms`);

      return tasks.map(task => this.mapPrismaToTask(task));
    } catch (error) {
      console.error('Error finding all tasks:', error);
      throw new Error('Error finding tasks');
    }
  }

  async findByUserId(userId: string): Promise<TaskData[]> {
    try {
      console.log(`🔍 Executing optimized findByUserId query for user: ${userId}`);
      const startTime = Date.now();
      
      const tasks = await this.prisma.task.findMany({
        where: { userId }, // Uses index on userId
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignedToUser: {
            select: { id: true, name: true, email: true, role: true }
          },
        },
        orderBy: [
          { createdAt: 'desc' }, // Uses composite index (userId, createdAt)
        ],
      });

      const queryTime = Date.now() - startTime;
      console.log(`⚡ findByUserId query completed in ${queryTime}ms`);

      return tasks.map(task => this.mapPrismaToTask(task));
    } catch (error) {
      console.error('Error finding tasks by user ID:', error);
      throw new Error('Error finding tasks');
    }
  }

  async findByAssignedTo(userId: string): Promise<TaskData[]> {
    try {
      console.log(`🔍 Executing optimized findByAssignedTo query for user: ${userId}`);
      const startTime = Date.now();
      
      const tasks = await this.prisma.task.findMany({
        where: { assignedTo: userId }, // Uses index on assignedTo
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignedToUser: {
            select: { id: true, name: true, email: true, role: true }
          },
        },
        orderBy: [
          { createdAt: 'desc' }, // Uses composite index (assignedTo, createdAt)
        ],
      });

      const queryTime = Date.now() - startTime;
      console.log(`⚡ findByAssignedTo query completed in ${queryTime}ms`);

      return tasks.map(task => this.mapPrismaToTask(task));
    } catch (error) {
      console.error('Error finding tasks by assigned user:', error);
      throw new Error('Error finding tasks');
    }
  }

  async update(id: string, data: Partial<CreateTaskData>): Promise<TaskData> {
    try {
      const updatedTask = await this.prisma.task.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate,
          assignedTo: data.assignedTo,
          completedAt: data.completedAt,
        },
        include: {
          user: true,
          assignedToUser: true,
        },
      });

      return this.mapPrismaToTask(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Error updating task');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.task.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Error deleting task');
    }
  }

  // Performance optimized methods using database indexes
  
  async countByStatus(status: string): Promise<number> {
    try {
      return await this.prisma.task.count({
        where: { status: status.toUpperCase() as any } // Uses index on status
      });
    } catch (error) {
      console.error('Error counting tasks by status:', error);
      throw new Error('Error counting tasks');
    }
  }

  async countByUser(userId: string): Promise<number> {
    try {
      return await this.prisma.task.count({
        where: { userId } // Uses index on userId
      });
    } catch (error) {
      console.error('Error counting tasks by user:', error);
      throw new Error('Error counting tasks');
    }
  }

  async findByStatusAndPriority(status: string, priority: string): Promise<TaskData[]> {
    try {
      const tasks = await this.prisma.task.findMany({
        where: {
          status: status.toUpperCase() as any,
          priority: priority.toUpperCase() as any
        }, // Uses composite index on (status, priority)
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          assignedToUser: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
      });

      return tasks.map(task => this.mapPrismaToTask(task));
    } catch (error) {
      console.error('Error finding tasks by status and priority:', error);
      throw new Error('Error finding tasks');
    }
  }

  async findRecentTasks(limit: number = 10): Promise<TaskData[]> {
    try {
      const tasks = await this.prisma.task.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          assignedToUser: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: [
          { updatedAt: 'desc' } // Uses index on updatedAt
        ],
        take: limit,
      });

      return tasks.map(task => this.mapPrismaToTask(task));
    } catch (error) {
      console.error('Error finding recent tasks:', error);
      throw new Error('Error finding recent tasks');
    }
  }

  async findOverdueTasks(): Promise<TaskData[]> {
    try {
      const now = new Date();
      const tasks = await this.prisma.task.findMany({
        where: {
          dueDate: {
            lt: now
          },
          status: {
            not: 'COMPLETED'
          }
        }, // Uses index on dueDate
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          assignedToUser: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: [
          { dueDate: 'asc' }
        ],
      });

      return tasks.map(task => this.mapPrismaToTask(task));
    } catch (error) {
      console.error('Error finding overdue tasks:', error);
      throw new Error('Error finding overdue tasks');
    }
  }

  // ULTRA-FAST assignment-specific methods
  async findByIdForAssignment(id: string): Promise<TaskData | null> {
    try {
      console.log(`🚀 ULTRA-FAST findByIdForAssignment: ${id}`);
      const startTime = Date.now();
      
      // Optimized query with minimal fields for assignment validation
      const task = await this.prisma.task.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          userId: true,
          assignedTo: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          // Only essential user fields for assignment
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignedToUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      const queryTime = Date.now() - startTime;
      console.log(`⚡ findByIdForAssignment completed in ${queryTime}ms`);

      return task ? this.mapPrismaToTask(task) : null;
    } catch (error) {
      console.error('Error finding task by ID for assignment:', error);
      throw new Error('Error finding task');
    }
  }

  async updateAssignment(id: string, assignedTo: string): Promise<TaskData> {
    try {
      console.log(`🚀 ULTRA-FAST updateAssignment: ${id} → ${assignedTo}`);
      const startTime = Date.now();
      
      // Ultra-optimized update with only necessary fields and minimal response
      const updatedTask = await this.prisma.task.update({
        where: { id },
        data: {
          assignedTo: assignedTo,
          updatedAt: new Date() // Explicit for cache invalidation
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          userId: true,
          assignedTo: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          // Minimal user data for response
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignedToUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      const queryTime = Date.now() - startTime;
      console.log(`⚡ updateAssignment completed in ${queryTime}ms`);

      return this.mapPrismaToTask(updatedTask);
    } catch (error) {
      console.error('Error updating task assignment:', error);
      throw new Error('Error updating task assignment');
    }
  }

  async existsTaskAndUser(taskId: string, userId: string): Promise<{ taskExists: boolean; userExists: boolean }> {
    try {
      console.log(`🚀 PARALLEL existence check: Task ${taskId} + User ${userId}`);
      const startTime = Date.now();
      
      // PARALLEL existence checks with minimal data transfer
      const [taskCheck, userCheck] = await Promise.all([
        this.prisma.task.findUnique({
          where: { id: taskId },
          select: { 
            id: true, 
            status: true, // For business rule validation
            assignedTo: true // For duplicate assignment check
          }
        }),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { 
            id: true,
            role: true // For authorization validation if needed
          }
        })
      ]);

      const queryTime = Date.now() - startTime;
      console.log(`⚡ Parallel existence check completed in ${queryTime}ms`);

      return {
        taskExists: taskCheck !== null,
        userExists: userCheck !== null
      };
    } catch (error) {
      console.error('Error checking task and user existence:', error);
      throw new Error('Error checking task and user existence');
    }
  }

  /**
   * Maps Prisma task object to TaskData
   */
  private mapPrismaToTask(prismaTask: any): TaskData {
    return {
      id: prismaTask.id,
      title: prismaTask.title,
      description: prismaTask.description,
      status: prismaTask.status,
      priority: prismaTask.priority,
      dueDate: prismaTask.dueDate,
      userId: prismaTask.userId,
      assignedTo: prismaTask.assignedTo,
      completedAt: prismaTask.completedAt,
      createdAt: prismaTask.createdAt,
      updatedAt: prismaTask.updatedAt,
    };
  }
} 