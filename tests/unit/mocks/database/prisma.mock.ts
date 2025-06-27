/**
 * Mock for PrismaClient
 * Provides comprehensive mocking for all database operations
 */

export const mockUserData = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    role: 'USER' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    address: {
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      stateOrProvince: 'NY',
      postalCode: '10001',
      country: 'USA'
    }
  },
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    phoneNumber: '+1987654321',
    role: 'ADMIN' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    address: null
  }
];

export const mockTaskData = [
  {
    id: 'task-1',
    title: 'Test Task 1',
    description: 'This is a test task',
    status: 'PENDING' as const,
    priority: 'MEDIUM' as const,
    dueDate: new Date('2024-12-31'),
    assignedUserId: 'user-1',
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'task-2',
    title: 'Test Task 2',
    description: 'Another test task',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    dueDate: new Date('2024-12-25'),
    assignedUserId: 'user-1',
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

export const createMockPrismaClient = () => {
  const mockPrisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn()
    },
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn()
    },
    address: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn()
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn()
  };

  // Default implementations for user operations
  mockPrisma.user.create.mockImplementation(async ({ data }) => ({
    ...data,
    id: data.id || `user-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  mockPrisma.user.findUnique.mockImplementation(async ({ where, include }) => {
    const user = mockUserData.find(u => 
      u.id === where.id || u.email === where.email
    );
    if (!user) return null;
    
    return include?.address ? user : { ...user, address: undefined };
  });

  mockPrisma.user.findMany.mockImplementation(async ({ include, orderBy, where }) => {
    let users = [...mockUserData];
    
    if (where) {
      if (where.role) {
        users = users.filter(u => u.role === where.role);
      }
      if (where.email) {
        users = users.filter(u => u.email === where.email);
      }
    }
    
    if (orderBy) {
      if (orderBy.createdAt === 'desc') {
        users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    }
    
    return include?.address ? users : users.map(u => ({ ...u, address: undefined }));
  });

  mockPrisma.user.update.mockImplementation(async ({ where, data, include }) => {
    const userIndex = mockUserData.findIndex(u => u.id === where.id);
    if (userIndex === -1) throw new Error('User not found');
    
    const updatedUser = {
      ...mockUserData[userIndex],
      ...data,
      updatedAt: new Date()
    };
    
    mockUserData[userIndex] = updatedUser;
    
    return include?.address ? updatedUser : { ...updatedUser, address: undefined };
  });

  mockPrisma.user.delete.mockImplementation(async ({ where }) => {
    const userIndex = mockUserData.findIndex(u => u.id === where.id);
    if (userIndex === -1) throw new Error('User not found');
    
    const deletedUser = mockUserData[userIndex];
    mockUserData.splice(userIndex, 1);
    
    return deletedUser;
  });

  // Default implementations for task operations
  mockPrisma.task.create.mockImplementation(async ({ data }) => ({
    ...data,
    id: data.id || `task-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  mockPrisma.task.findUnique.mockImplementation(async ({ where, include }) => {
    const task = mockTaskData.find(t => t.id === where.id);
    if (!task) return null;
    
    if (include?.assignedUser) {
      const user = mockUserData.find(u => u.id === task.assignedUserId);
      return { ...task, assignedUser: user };
    }
    
    return task;
  });

  mockPrisma.task.findMany.mockImplementation(async ({ where, include, orderBy }) => {
    let tasks = [...mockTaskData];
    
    if (where) {
      if (where.assignedUserId) {
        tasks = tasks.filter(t => t.assignedUserId === where.assignedUserId);
      }
      if (where.status) {
        tasks = tasks.filter(t => t.status === where.status);
      }
      if (where.priority) {
        tasks = tasks.filter(t => t.priority === where.priority);
      }
    }
    
    if (orderBy) {
      if (orderBy.createdAt === 'desc') {
        tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      if (orderBy.dueDate === 'asc') {
        tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      }
    }
    
    if (include?.assignedUser) {
      return tasks.map(task => {
        const user = mockUserData.find(u => u.id === task.assignedUserId);
        return { ...task, assignedUser: user };
      });
    }
    
    return tasks;
  });

  mockPrisma.task.update.mockImplementation(async ({ where, data, include }) => {
    const taskIndex = mockTaskData.findIndex(t => t.id === where.id);
    if (taskIndex === -1) throw new Error('Task not found');
    
    const updatedTask = {
      ...mockTaskData[taskIndex],
      ...data,
      updatedAt: new Date()
    };
    
    mockTaskData[taskIndex] = updatedTask;
    
    if (include?.assignedUser) {
      const user = mockUserData.find(u => u.id === updatedTask.assignedUserId);
      return { ...updatedTask, assignedUser: user };
    }
    
    return updatedTask;
  });

  mockPrisma.task.delete.mockImplementation(async ({ where }) => {
    const taskIndex = mockTaskData.findIndex(t => t.id === where.id);
    if (taskIndex === -1) throw new Error('Task not found');
    
    const deletedTask = mockTaskData[taskIndex];
    mockTaskData.splice(taskIndex, 1);
    
    return deletedTask;
  });

  // Transaction support
  mockPrisma.$transaction.mockImplementation(async (callback) => {
    if (typeof callback === 'function') {
      return await callback(mockPrisma);
    }
    // For array of operations
    return Promise.all(callback);
  });

  return mockPrisma;
};

export const mockPrismaClient = createMockPrismaClient(); 