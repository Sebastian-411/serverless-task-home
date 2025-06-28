const { GetTaskByIdUseCase } = require('../../../../../core/task/application/get-task-by-id.usecase');
const GetTaskValidationError = require('../../../../../shared/domain/exceptions/validation.error');

describe('GetTaskByIdUseCase', () => {
  let getTaskByIdUseCase;
  let mockTaskRepository;

  const validTaskData = {
    id: '12345678-1234-4123-8123-123456789012',
    title: 'Test Task',
    description: 'Task description',
    status: 'PENDING',
    priority: 'HIGH',
    dueDate: '2024-12-31T23:59:59.000Z',
    assignedTo: '12345678-1234-4123-8123-123456789013',
    userId: '12345678-1234-4123-8123-123456789014',
    completedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    mockTaskRepository = {
      findById: jest.fn()
    };

    getTaskByIdUseCase = new GetTaskByIdUseCase(mockTaskRepository);
  });

  describe('execute', () => {
    it('should get task by id successfully and normalize data', async () => {
      mockTaskRepository.findById.mockResolvedValue(validTaskData);

      const request = {
        taskId: validTaskData.id,
        requestingUserId: validTaskData.userId,
        requestingUserRole: 'admin'
      };

      const result = await getTaskByIdUseCase.execute(request);

      expect(result).toBeDefined();
      expect(result.id).toBe(validTaskData.id);
      expect(result.title).toBe(validTaskData.title);
      // Verify priority is normalized to lowercase
      expect(result.priority).toBe('high');
      // Verify status is normalized to lowercase  
      expect(result.status).toBe('pending');
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(validTaskData.id);
    });

    it('should allow admin to access any task', async () => {
      mockTaskRepository.findById.mockResolvedValue(validTaskData);

      const request = {
        taskId: validTaskData.id,
        requestingUserId: 'different-user-id',
        requestingUserRole: 'admin'
      };

      const result = await getTaskByIdUseCase.execute(request);
      expect(result).toBeDefined();
    });

    it('should allow task owner to access their task', async () => {
      mockTaskRepository.findById.mockResolvedValue(validTaskData);

      const request = {
        taskId: validTaskData.id,
        requestingUserId: validTaskData.userId,
        requestingUserRole: 'user'
      };

      const result = await getTaskByIdUseCase.execute(request);
      expect(result).toBeDefined();
    });

    it('should allow assigned user to access task', async () => {
      mockTaskRepository.findById.mockResolvedValue(validTaskData);

      const request = {
        taskId: validTaskData.id,
        requestingUserId: validTaskData.assignedTo,
        requestingUserRole: 'user'
      };

      const result = await getTaskByIdUseCase.execute(request);
      expect(result).toBeDefined();
    });

    it('should throw error when task not found', async () => {
      mockTaskRepository.findById.mockResolvedValue(null);

      const request = {
        taskId: 'non-existent-id',
        requestingUserId: 'user-id',
        requestingUserRole: 'user'
      };

      await expect(getTaskByIdUseCase.execute(request)).rejects.toThrow(GetTaskValidationError);
      await expect(getTaskByIdUseCase.execute(request)).rejects.toThrow('Task not found');
    });

    it('should deny access to unauthorized user', async () => {
      mockTaskRepository.findById.mockResolvedValue(validTaskData);

      const request = {
        taskId: validTaskData.id,
        requestingUserId: 'unauthorized-user-id',
        requestingUserRole: 'user'
      };

      await expect(getTaskByIdUseCase.execute(request)).rejects.toThrow(GetTaskValidationError);
      await expect(getTaskByIdUseCase.execute(request)).rejects.toThrow('Access denied to this task');
    });

    it('should validate required input fields', async () => {
      const invalidRequest = {
        taskId: '',
        requestingUserId: '',
        requestingUserRole: ''
      };

      await expect(getTaskByIdUseCase.execute(invalidRequest)).rejects.toThrow(GetTaskValidationError);
    });
  });
}); 