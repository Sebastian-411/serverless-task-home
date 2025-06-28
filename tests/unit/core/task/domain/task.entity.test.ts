/**
 * Task Entity Domain Tests - Comprehensive Testing
 * Complete testing for Task domain entity
 */

const TaskEntity = require('../../../../../core/task/domain/task.entity');
const CustomValidationError = require('../../../../../shared/domain/exceptions/validation.error');
const { TASK_STATUS: TaskStatus, TASK_PRIORITY: TaskPriority } = require('../../../../../shared/domain/value-objects/constants');

describe('Task Entity Domain Tests', () => {
  describe('Task Constructor', () => {
    const validTaskData = {
      id: '12345678-1234-4123-8123-123456789012',
      title: 'Test Task',
      description: 'Task description',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: '2024-12-31T23:59:59.000Z',
      assignedTo: '12345678-1234-4123-8123-123456789013',
      userId: '12345678-1234-4123-8123-123456789014',
      completedAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    it('should create a task with valid data', () => {
      const task = new TaskEntity(validTaskData);
      
      expect(task.id).toBe(validTaskData.id);
      expect(task.title).toBe(validTaskData.title);
      expect(task.description).toBe(validTaskData.description);
      expect(task.status).toBe(validTaskData.status);
      expect(task.priority).toBe(validTaskData.priority);
      expect(task.assignedTo).toBe(validTaskData.assignedTo);
      expect(task.userId).toBe(validTaskData.userId);
    });

    it('should throw ValidationError for invalid ID', () => {
      expect(() => {
        new TaskEntity({ ...validTaskData, id: 'invalid-id' });
      }).toThrow(CustomValidationError);
    });

    it('should throw ValidationError for empty title', () => {
      expect(() => {
        new TaskEntity({ ...validTaskData, title: '' });
      }).toThrow(CustomValidationError);
    });

    it('should throw ValidationError for title too long', () => {
      const longTitle = 'x'.repeat(256);
      expect(() => {
        new TaskEntity({ ...validTaskData, title: longTitle });
      }).toThrow(CustomValidationError);
    });

    it('should throw ValidationError for invalid status', () => {
      expect(() => {
        new TaskEntity({ ...validTaskData, status: 'INVALID_STATUS' });
      }).toThrow(CustomValidationError);
    });

    it('should throw ValidationError for invalid priority', () => {
      expect(() => {
        new TaskEntity({ ...validTaskData, priority: 'INVALID_PRIORITY' });
      }).toThrow(CustomValidationError);
    });

    it('should handle null description', () => {
      const task = new TaskEntity({ ...validTaskData, description: null });
      expect(task.description).toBe(null);
    });

    it('should handle null due date', () => {
      const task = new TaskEntity({ ...validTaskData, dueDate: null });
      expect(task.dueDate).toBe(null);
    });

    it('should trim whitespace from title', () => {
      const task = new TaskEntity({ ...validTaskData, title: '  Test Task  ' });
      expect(task.title).toBe('Test Task');
    });

    it('should normalize priority to lowercase - UPPERCASE', () => {
      const task = new TaskEntity({ ...validTaskData, priority: 'HIGH' });
      expect(task.priority).toBe('high');
    });

    it('should normalize priority to lowercase - MixedCase', () => {
      const task = new TaskEntity({ ...validTaskData, priority: 'Urgent' });
      expect(task.priority).toBe('urgent');
    });

    it('should normalize status to lowercase - UPPERCASE', () => {
      const task = new TaskEntity({ ...validTaskData, status: 'PENDING' });
      expect(task.status).toBe('pending');
    });

    it('should normalize status to lowercase - MixedCase', () => {
      const task = new TaskEntity({ ...validTaskData, status: 'In_Progress' });
      expect(task.status).toBe('in_progress');
    });
  });

  describe('Task.create Factory Method', () => {
    it('should create a new task with auto-generated ID and timestamps', () => {
      const taskData = {
        title: 'New Task',
        description: 'New task description',
        userId: '12345678-1234-4123-8123-123456789012'
      };

      const task = TaskEntity.create(taskData);

      expect(task.id).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.userId).toBe(taskData.userId);
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    it('should override defaults when specified', () => {
      const taskData = {
        title: 'High Priority Task',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        userId: '12345678-1234-4123-8123-123456789012'
      };

      const task = TaskEntity.create(taskData);

      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
      expect(task.priority).toBe(TaskPriority.HIGH);
    });

    it('should generate unique IDs for different tasks', () => {
      const task1 = TaskEntity.create({ title: 'Task 1', userId: '12345678-1234-4123-8123-123456789012' });
      const task2 = TaskEntity.create({ title: 'Task 2', userId: '12345678-1234-4123-8123-123456789012' });

      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe('Task Status Transitions', () => {
    let task;

    beforeEach(() => {
      task = TaskEntity.create({
        title: 'Test Task',
        userId: '12345678-1234-4123-8123-123456789012'
      });
    });

    it('should start a pending task', () => {
      expect(task.status).toBe(TaskStatus.PENDING);
      
      task.start();
      
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should complete a task', () => {
      task.start();
      
      task.complete();
      
      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.completedAt).toBeDefined();
    });

    it('should cancel a task', () => {
      task.cancel();
      
      expect(task.status).toBe(TaskStatus.CANCELLED);
    });

    it('should reopen a completed task', () => {
      task.start();
      task.complete();
      
      task.reopen();
      
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.completedAt).toBe(null);
    });

    it('should throw error when starting non-pending task', () => {
      task.start();
      
      expect(() => task.start()).toThrow(CustomValidationError);
    });

    it('should throw error when completing already completed task', () => {
      task.start();
      task.complete();
      
      expect(() => task.complete()).toThrow(CustomValidationError);
    });

    it('should throw error when cancelling completed task', () => {
      task.start();
      task.complete();
      
      expect(() => task.cancel()).toThrow(CustomValidationError);
    });
  });

  describe('Task Assignment Functionality', () => {
    let task;

    beforeEach(() => {
      task = TaskEntity.create({
        title: 'Test Task',
        userId: '12345678-1234-4123-8123-123456789012'
      });
    });

    it('should assign task to a user', () => {
      const userId = '12345678-1234-4123-8123-123456789013';
      
      task.assignTo(userId);
      
      expect(task.assignedTo).toBe(userId);
      expect(task.isAssigned()).toBe(true);
    });

    it('should unassign a task', () => {
      const userId = '12345678-1234-4123-8123-123456789013';
      task.assignTo(userId);
      
      task.unassign();
      
      expect(task.assignedTo).toBe(null);
      expect(task.isAssigned()).toBe(false);
    });

    it('should return task when unassigned initially', () => {
      expect(task.isAssigned()).toBe(false);
    });
  });

  describe('Task Due Date Validation', () => {
    let task;

    beforeEach(() => {
      task = TaskEntity.create({
        title: 'Test Task',
        userId: '12345678-1234-4123-8123-123456789012'
      });
    });

    it('should handle valid due date', () => {
      const dueDate = new Date('2024-12-31T23:59:59.000Z');
      
      task.update({ dueDate });
      
      expect(task.dueDate).toEqual(dueDate);
    });

    it('should detect overdue tasks', () => {
      const pastDate = new Date('2020-01-01T00:00:00.000Z');
      
      task.update({ dueDate: pastDate });
      
      expect(task.isOverdue()).toBe(true);
    });

    it('should not consider completed tasks as overdue', () => {
      const pastDate = new Date('2020-01-01T00:00:00.000Z');
      task.update({ dueDate: pastDate });
      task.start();
      task.complete();
      
      expect(task.isOverdue()).toBe(false);
    });

    it('should calculate days until due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      task.update({ dueDate: futureDate });
      
      expect(task.getDaysUntilDue()).toBe(5);
    });

    it('should return null for tasks without due date', () => {
      expect(task.getDaysUntilDue()).toBe(null);
    });
  });

  describe('Task Completion Logic', () => {
    let task;

    beforeEach(() => {
      task = TaskEntity.create({
        title: 'Test Task',
        userId: '12345678-1234-4123-8123-123456789012'
      });
    });

    it('should check if task is pending', () => {
      expect(task.isPending()).toBe(true);
      expect(task.isInProgress()).toBe(false);
      expect(task.isCompleted()).toBe(false);
      expect(task.isCancelled()).toBe(false);
    });

    it('should check if task is in progress', () => {
      task.start();
      
      expect(task.isPending()).toBe(false);
      expect(task.isInProgress()).toBe(true);
      expect(task.isCompleted()).toBe(false);
      expect(task.isCancelled()).toBe(false);
    });

    it('should check if task is completed', () => {
      task.start();
      task.complete();
      
      expect(task.isPending()).toBe(false);
      expect(task.isInProgress()).toBe(false);
      expect(task.isCompleted()).toBe(true);
      expect(task.isCancelled()).toBe(false);
    });

    it('should check if task is cancelled', () => {
      task.cancel();
      
      expect(task.isPending()).toBe(false);
      expect(task.isInProgress()).toBe(false);
      expect(task.isCompleted()).toBe(false);
      expect(task.isCancelled()).toBe(true);
    });
  });

  describe('Task Priority Management', () => {
    let task;

    beforeEach(() => {
      task = TaskEntity.create({
        title: 'Test Task',
        userId: '12345678-1234-4123-8123-123456789012'
      });
    });

    it('should detect high priority tasks', () => {
      task.update({ priority: TaskPriority.HIGH });
      
      expect(task.isHighPriority()).toBe(true);
    });

    it('should not consider medium priority as high', () => {
      task.update({ priority: TaskPriority.MEDIUM });
      
      expect(task.isHighPriority()).toBe(false);
    });

    it('should not consider low priority as high', () => {
      task.update({ priority: TaskPriority.LOW });
      
      expect(task.isHighPriority()).toBe(false);
    });

    it('should update priority correctly', () => {
      task.update({ priority: TaskPriority.CRITICAL });
      
      expect(task.priority).toBe(TaskPriority.CRITICAL);
    });
  });

  describe('Task Serialization Methods', () => {
    let task;

    beforeEach(() => {
      task = TaskEntity.create({
        title: 'Test Task',
        description: 'Test description',
        userId: '12345678-1234-4123-8123-123456789012'
      });
    });

    it('should convert to JSON', () => {
      const json = task.toJSON();
      
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('title');
      expect(json).toHaveProperty('description');
      expect(json).toHaveProperty('status');
      expect(json).toHaveProperty('priority');
      expect(json).toHaveProperty('userId');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });

    it('should convert to Prisma format', () => {
      const prismaData = task.toPrisma();
      
      expect(prismaData.status).toBe(task.status.toUpperCase());
      expect(prismaData.priority).toBe(task.priority.toUpperCase());
      expect(prismaData.title).toBe(task.title);
    });

    it('should create from Prisma data', () => {
      const prismaData = {
        id: '12345678-1234-4123-8123-123456789012',
        title: 'Prisma Task',
        description: 'Prisma description',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(),
        assignedTo: null,
        userId: '12345678-1234-4123-8123-123456789013',
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task = TaskEntity.fromPrisma(prismaData);
      
      expect(task.status).toBe(prismaData.status.toLowerCase());
      expect(task.priority).toBe(prismaData.priority.toLowerCase());
      expect(task.title).toBe(prismaData.title);
    });

    it('should handle null Prisma data', () => {
      const task = TaskEntity.fromPrisma(null);
      
      expect(task).toBe(null);
    });
  });

  describe('Task Update Method', () => {
    let task;

    beforeEach(() => {
      task = TaskEntity.create({
        title: 'Original Task',
        userId: '12345678-1234-4123-8123-123456789012'
      });
    });

    it('should update multiple fields at once', () => {
      const updates = {
        title: 'Updated Task',
        description: 'Updated description',
        priority: TaskPriority.HIGH
      };

      task.update(updates);

      expect(task.title).toBe(updates.title);
      expect(task.description).toBe(updates.description);
      expect(task.priority).toBe(updates.priority);
    });

    it('should ignore undefined values', () => {
      const originalTitle = task.title;
      
      task.update({ title: undefined, description: 'New description' });

      expect(task.title).toBe(originalTitle);
      expect(task.description).toBe('New description');
    });

    it('should ignore non-allowed fields', () => {
      const originalId = task.id;
      
      task.update({ id: 'new-id', title: 'Updated Title' });

      expect(task.id).toBe(originalId);
      expect(task.title).toBe('Updated Title');
    });
  });
}); 