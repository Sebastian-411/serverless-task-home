/**
 * Mock for UserRepository
 * Provides comprehensive mocking for all user repository operations
 */

import { mockUserData } from '../database/prisma.mock';

export const createMockUserRepository = () => {
  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  // Default implementations
  mockUserRepository.create.mockImplementation(async (userData: any) => {
    const newUser = {
      ...userData,
      id: userData.id || `user-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Simulate unique email constraint
    const existingUser = mockUserData.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    return newUser;
  });

  mockUserRepository.findById.mockImplementation(async (id: string) => {
    const user = mockUserData.find(u => u.id === id);
    return user || null;
  });

  mockUserRepository.findByEmail.mockImplementation(async (email: string) => {
    const user = mockUserData.find(u => u.email === email);
    return user || null;
  });

  mockUserRepository.findAll.mockImplementation(async () => {
    return [...mockUserData];
  });

  mockUserRepository.update.mockImplementation(async (id: string, data: any) => {
    const userIndex = mockUserData.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...mockUserData[userIndex],
      ...data,
      updatedAt: new Date()
    };
    
    // Simulate unique email constraint
    if (data.email) {
      const existingUser = mockUserData.find(u => u.email === data.email && u.id !== id);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }
    
    return updatedUser;
  });

  mockUserRepository.delete.mockImplementation(async (id: string) => {
    const userIndex = mockUserData.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Return void as expected
    return Promise.resolve();
  });

  return mockUserRepository;
};

export const mockUserRepository = createMockUserRepository(); 