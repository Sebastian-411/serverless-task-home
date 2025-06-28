import { TaskRepository, TaskData } from '../infrastructure/task.repository.prisma';
import { Cache, CacheKeys } from '../../../shared/cache/cache.service';

export interface GetTasksResponse {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  userId: string;
  assignedTo?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
}

export class GetTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(authContext: AuthContext): Promise<GetTasksResponse[]> {
    try {
      // Validate authentication
      if (!authContext.isAuthenticated || !authContext.user) {
        throw new Error('Authentication required to access tasks');
      }

      const user = authContext.user;
      
      // Ultra-fast cache strategy based on user role
      let cacheKey: string;
      let cacheHitMessage: string;
      
      if (user.role === 'admin') {
        cacheKey = CacheKeys.tasksList();
        cacheHitMessage = '🚀 Admin tasks cache HIT - All tasks served in ~1ms';
      } else {
        cacheKey = CacheKeys.assignedTasks(user.id);
        cacheHitMessage = `🚀 User tasks cache HIT - Tasks for ${user.id} served in ~1ms`;
      }

      // Try cache first for sub-100ms response
      const cachedTasks = Cache.get<GetTasksResponse[]>(cacheKey);
      if (cachedTasks) {
        console.log(cacheHitMessage);
        return cachedTasks;
      }

      console.log(`🔍 Cache MISS - Fetching tasks for ${user.role} from database...`);
      const startTime = Date.now();

      let tasks: TaskData[];

      // Authorization logic based on user role
      if (user.role === 'admin') {
        // Admin can see all tasks
        tasks = await this.taskRepository.findAll();
      } else if (user.role === 'user') {
        // Regular user can only see tasks assigned to them
        tasks = await this.taskRepository.findByAssignedTo(user.id);
      } else {
        throw new Error('Invalid user role');
      }

      // Transform tasks
      const transformedTasks = tasks.map(task => this.formatTaskResponse(task));

      // Cache with appropriate TTL based on data type
      if (user.role === 'admin') {
        // Admin data changes more frequently, shorter cache
        Cache.setHot(cacheKey, transformedTasks);
      } else {
        // User-specific data is more stable, longer cache
        Cache.setWarm(cacheKey, transformedTasks);
      }

      const queryTime = Date.now() - startTime;
      console.log(`✅ Tasks fetched and cached in ${queryTime}ms for ${user.role}`);

      // Prefetch related data for better performance
      this.prefetchRelatedData(user, transformedTasks);

      return transformedTasks;

    } catch (error) {
      console.error('Error in GetTasksUseCase:', error);
      
      // Re-throw specific errors to preserve their messages
      if (error instanceof Error) {
        if (error.message === 'Authentication required to access tasks' ||
            error.message === 'Invalid user role') {
          throw error;
        }
      }
      
      throw new Error('Error retrieving tasks');
    }
  }

  /**
   * Format task data for API consumption
   */
  private formatTaskResponse(task: TaskData): GetTasksResponse {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status.toLowerCase() as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
      dueDate: task.dueDate,
      userId: task.userId,
      assignedTo: task.assignedTo,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Intelligent prefetching for better user experience
   */
  private async prefetchRelatedData(user: any, tasks: GetTasksResponse[]): Promise<void> {
    try {
      // Prefetch individual task details for likely requests
      const recentTasks = tasks
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5); // Top 5 most recent tasks

      recentTasks.forEach(task => {
        Cache.prefetch(
          CacheKeys.task(task.id),
          async () => {
            return await this.taskRepository.findById(task.id);
          }
        );
      });

      // Prefetch task counts for dashboard-like views
      if (user.role === 'admin') {
        Cache.prefetch(
          CacheKeys.tasksCount(),
          async () => {
            const counts = await Promise.all([
              this.taskRepository.countByStatus('pending'),
              this.taskRepository.countByStatus('in_progress'),
              this.taskRepository.countByStatus('completed'),
            ]);
            return {
              pending: counts[0],
              in_progress: counts[1],
              completed: counts[2],
              total: counts.reduce((a, b) => a + b, 0)
            };
          }
        );
      }
    } catch (error) {
      // Silently fail prefetch - it's an optimization, not critical
      console.warn('Prefetch warning:', error);
    }
  }
} 