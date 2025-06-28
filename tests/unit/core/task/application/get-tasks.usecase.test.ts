import { GetTasksUseCase } from '../../../../../core/task/application/get-tasks.usecase';
import { TaskRepository, TaskData } from '../../../../../core/task/infrastructure/task.repository.prisma';

// Mock task repository
const mockTaskRepository = {
  findAll: jest.fn(),
  findByAssignedTo: jest.fn(),
} as unknown as TaskRepository;

describe('GetTasksUseCase Application Tests', () => {
  let getTasksUseCase: GetTasksUseCase;

  beforeEach(() => {
    getTasksUseCase = new GetTasksUseCase(mockTaskRepository);
    jest.clearAllMocks();
  });

  const createMockTask = (overrides: Partial<TaskData> = {}): TaskData => ({
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: new Date('2024-12-31'),
    userId: 'creator-id',
    assignedTo: 'assigned-user-id',
    completedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  describe('Admin Access', () => {
    const adminAuthContext = {
      isAuthenticated: true,
      user: {
        id: 'admin-id',
        email: 'admin@test.com',
        role: 'admin' as const
      }
    };

    it('should allow admin to get all tasks', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', title: 'Task 1' }),
        createMockTask({ id: 'task-2', title: 'Task 2', assignedTo: 'other-user' }),
        createMockTask({ id: 'task-3', title: 'Task 3', assignedTo: null }),
      ];

      (mockTaskRepository.findAll as jest.Mock).mockResolvedValue(mockTasks);

      const result = await getTasksUseCase.execute(adminAuthContext);

      expect(mockTaskRepository.findAll).toHaveBeenCalledWith();
      expect(mockTaskRepository.findByAssignedTo).not.toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Task 1');
      expect(result[1].title).toBe('Task 2');
      expect(result[2].title).toBe('Task 3');
    });

    it('should handle empty tasks list for admin', async () => {
      (mockTaskRepository.findAll as jest.Mock).mockResolvedValue([]);

      const result = await getTasksUseCase.execute(adminAuthContext);

      expect(result).toHaveLength(0);
      expect(mockTaskRepository.findAll).toHaveBeenCalledWith();
    });

    it('should properly transform task statuses and priorities to lowercase', async () => {
      const mockTasks = [
        createMockTask({ 
          status: 'IN_PROGRESS', 
          priority: 'HIGH' 
        }),
        createMockTask({ 
          status: 'COMPLETED', 
          priority: 'URGENT' 
        }),
      ];

      (mockTaskRepository.findAll as jest.Mock).mockResolvedValue(mockTasks);

      const result = await getTasksUseCase.execute(adminAuthContext);

      expect(result[0].status).toBe('in_progress');
      expect(result[0].priority).toBe('high');
      expect(result[1].status).toBe('completed');
      expect(result[1].priority).toBe('urgent');
    });
  });

  describe('User Access', () => {
    const userAuthContext = {
      isAuthenticated: true,
      user: {
        id: 'user-id',
        email: 'user@test.com',
        role: 'user' as const
      }
    };

    it('should allow user to get only assigned tasks', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-1', title: 'Assigned Task 1', assignedTo: 'user-id' }),
        createMockTask({ id: 'task-2', title: 'Assigned Task 2', assignedTo: 'user-id' }),
      ];

      (mockTaskRepository.findByAssignedTo as jest.Mock).mockResolvedValue(mockTasks);

      const result = await getTasksUseCase.execute(userAuthContext);

      expect(mockTaskRepository.findByAssignedTo).toHaveBeenCalledWith('user-id');
      expect(mockTaskRepository.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Assigned Task 1');
      expect(result[1].title).toBe('Assigned Task 2');
    });

    it('should handle empty assigned tasks list for user', async () => {
      (mockTaskRepository.findByAssignedTo as jest.Mock).mockResolvedValue([]);

      const result = await getTasksUseCase.execute(userAuthContext);

      expect(result).toHaveLength(0);
      expect(mockTaskRepository.findByAssignedTo).toHaveBeenCalledWith('user-id');
    });

    it('should handle tasks without descriptions and due dates', async () => {
      const mockTasks = [
        createMockTask({ 
          description: undefined, 
          dueDate: undefined,
          assignedTo: 'user-id' 
        }),
      ];

      (mockTaskRepository.findByAssignedTo as jest.Mock).mockResolvedValue(mockTasks);

      const result = await getTasksUseCase.execute(userAuthContext);

      expect(result[0].description).toBeUndefined();
      expect(result[0].dueDate).toBeUndefined();
    });
  });

  describe('Authorization Validation', () => {
    it('should prevent unauthenticated user from accessing tasks', async () => {
      const unauthenticatedContext = {
        isAuthenticated: false,
        user: undefined
      };

      await expect(
        getTasksUseCase.execute(unauthenticatedContext)
      ).rejects.toThrow('Authentication required to access tasks');

      expect(mockTaskRepository.findAll).not.toHaveBeenCalled();
      expect(mockTaskRepository.findByAssignedTo).not.toHaveBeenCalled();
    });

    it('should prevent authenticated user without user context from accessing tasks', async () => {
      const invalidAuthContext = {
        isAuthenticated: true,
        user: undefined
      };

      await expect(
        getTasksUseCase.execute(invalidAuthContext)
      ).rejects.toThrow('Authentication required to access tasks');
    });

    it('should handle invalid user role', async () => {
      const invalidRoleContext = {
        isAuthenticated: true,
        user: {
          id: 'user-id',
          email: 'user@test.com',
          role: 'invalid' as any
        }
      };

      await expect(
        getTasksUseCase.execute(invalidRoleContext)
      ).rejects.toThrow('Invalid user role');
    });
  });

  describe('Error Handling', () => {
    const adminAuthContext = {
      isAuthenticated: true,
      user: {
        id: 'admin-id',
        email: 'admin@test.com',
        role: 'admin' as const
      }
    };

    it('should handle repository errors for admin', async () => {
      (mockTaskRepository.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        getTasksUseCase.execute(adminAuthContext)
      ).rejects.toThrow('Error retrieving tasks');
    });

    it('should handle repository errors for user', async () => {
      const userAuthContext = {
        isAuthenticated: true,
        user: {
          id: 'user-id',
          email: 'user@test.com',
          role: 'user' as const
        }
      };

      (mockTaskRepository.findByAssignedTo as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        getTasksUseCase.execute(userAuthContext)
      ).rejects.toThrow('Error retrieving tasks');
    });

    it('should preserve specific error messages', async () => {
      (mockTaskRepository.findAll as jest.Mock).mockRejectedValue(new Error('Authentication required to access tasks'));

      await expect(
        getTasksUseCase.execute(adminAuthContext)
      ).rejects.toThrow('Authentication required to access tasks');
    });

    it('should handle unknown errors gracefully', async () => {
      (mockTaskRepository.findAll as jest.Mock).mockRejectedValue('Unknown error');

      await expect(
        getTasksUseCase.execute(adminAuthContext)
      ).rejects.toThrow('Error retrieving tasks');
    });
  });

  describe('Data Formatting', () => {
    const adminAuthContext = {
      isAuthenticated: true,
      user: {
        id: 'admin-id',
        email: 'admin@test.com',
        role: 'admin' as const
      }
    };

    it('should format response with all task properties', async () => {
      const mockTask = createMockTask({
        id: 'task-1',
        title: 'Complete Task',
        description: 'Task description',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date('2024-12-31'),
        userId: 'creator-id',
        assignedTo: 'assigned-id',
        completedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });

      (mockTaskRepository.findAll as jest.Mock).mockResolvedValue([mockTask]);

      const result = await getTasksUseCase.execute(adminAuthContext);

      expect(result[0]).toEqual({
        id: 'task-1',
        title: 'Complete Task',
        description: 'Task description',
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        userId: 'creator-id',
        assignedTo: 'assigned-id',
        completedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });
    });
  });
}); 