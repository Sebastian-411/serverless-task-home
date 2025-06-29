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
    address: null
  },
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    phoneNumber: '+1234567891',
    role: 'ADMIN' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    address: null
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

  mockPrisma.user.findFirst.mockImplementation((params: { where: unknown }) => {
    // Mock implementation for findFirst
    return Promise.resolve(null);
  });

  mockPrisma.user.update.mockImplementation((params: { where: unknown; data: unknown }) => {
    // Mock implementation for update
    return Promise.resolve({} as unknown);
  });

  mockPrisma.user.delete.mockImplementation((params: { where: unknown }) => {
    // Mock implementation for delete
    return Promise.resolve({} as unknown);
  });

  // Default implementations for address operations
  mockPrisma.address.create.mockImplementation(async ({ data }) => ({
    ...data,
    id: data.id || `address-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  mockPrisma.address.findUnique.mockImplementation(async ({ where }) => {
    return null; // No mock address data for now
  });

  mockPrisma.address.findMany.mockImplementation(async () => {
    return [];
  });

  mockPrisma.address.update.mockImplementation(async ({ where, data }) => {
    throw new Error('Address not found');
  });

  mockPrisma.address.delete.mockImplementation(async ({ where }) => {
    throw new Error('Address not found');
  });

  return mockPrisma;
};

export const mockPrismaClient = createMockPrismaClient(); 