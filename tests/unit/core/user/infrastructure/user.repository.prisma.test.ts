/**
 * UserRepositoryPrisma Infrastructure Tests
 * Comprehensive testing for User repository with >80% coverage
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import type { CreateUserData } from '../../../../../core/user/domain/entities/user.entity';
import { UserRepositoryPrisma } from '../../../../../core/user/infrastructure/adapters/out/user-repository-prisma';
import * as Cache from '../../../../../core/common/config/cache/cache.service';

// Mock the cache service
jest.mock('../../../../../core/common/config/cache/cache.service', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  getOrSet: jest.fn(),
  invalidatePattern: jest.fn(),
  Keys: {
    user: (id: string) => `user:${id}`,
    userByEmail: (email: string) => `user:email:${email}`,
    users: () => 'users:list'
  }
}));

describe('UserRepositoryPrisma Infrastructure Tests', () => {
  let userRepository: UserRepositoryPrisma;
  let mockPrisma: any;

  const mockUserData = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      role: 'USER',
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
      role: 'ADMIN',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      address: null
    }
  ];

  beforeEach(() => {
    mockPrisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn()
      }
    };
    
    userRepository = new UserRepositoryPrisma(mockPrisma);
    
    // Reset mock data
    jest.clearAllMocks();
    
    // Default cache behavior - call the factory function (which makes the DB call)
    (Cache.getOrSet as jest.Mock).mockImplementation(async (key: string, factory: () => any) => await factory());
  });

  describe('create', () => {
    const validCreateUserData: CreateUserData = {
      id: 'new-user-id',
      name: 'New User',
      email: 'newuser@example.com',
      phoneNumber: '+1234567890',
      role: 'USER',
      address: {
        addressLine1: '123 New St',
        city: 'New City',
        stateOrProvince: 'NC',
        postalCode: '12345',
        country: 'USA'
      }
    };

    it('should create a new user successfully', async () => {
      const expectedUser = {
        ...validCreateUserData,
        createdAt: new Date(),
        updatedAt: new Date(),
        address: validCreateUserData.address
      };
      
      // Mock cache getOrSet to return null (no existing user) then the created user
      (Cache.getOrSet as any).mockResolvedValueOnce(null); // For findByEmail check
      mockPrisma.user.create.mockResolvedValueOnce(expectedUser);

      const result = await userRepository.create(validCreateUserData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: validCreateUserData.id,
          name: validCreateUserData.name,
          email: validCreateUserData.email,
          phoneNumber: validCreateUserData.phoneNumber,
          role: validCreateUserData.role,
          address: {
            create: validCreateUserData.address
          }
        },
        include: {
          address: true
        }
      });

      expect(result).toEqual(expectedUser);
    });

    it('should create user without address', async () => {
      const userDataWithoutAddress = { ...validCreateUserData };
      delete userDataWithoutAddress.address;

      (Cache.getOrSet as any).mockResolvedValueOnce(null); // For findByEmail check
      
      const expectedUser = {
        ...userDataWithoutAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
        address: null
      };
      
      mockPrisma.user.create.mockResolvedValueOnce(expectedUser);

      const result = await userRepository.create(userDataWithoutAddress);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: userDataWithoutAddress.id,
          name: userDataWithoutAddress.name,
          email: userDataWithoutAddress.email,
          phoneNumber: userDataWithoutAddress.phoneNumber,
          role: userDataWithoutAddress.role,
          address: undefined
        },
        include: {
          address: true
        }
      });

      expect(result).toEqual(expectedUser);
    });

    it('should throw error if user with email already exists', async () => {
      const existingUser = { ...mockUserData[0] };
      // Mock the cache getOrSet to return the existing user (simulating cache hit)
      (Cache.getOrSet as any).mockResolvedValueOnce(existingUser);

      await expect(userRepository.create(validCreateUserData))
        .rejects.toThrow('User with this email already exists');

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const expectedUser = mockUserData[0];
      mockPrisma.user.findUnique.mockResolvedValueOnce(expectedUser);

      const result = await userRepository.findById('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { address: true }
      });

      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await userRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const expectedUser = mockUserData[0];
      mockPrisma.user.findUnique.mockResolvedValueOnce(expectedUser);

      const result = await userRepository.findByEmail('john@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        include: { address: true }
      });

      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const expectedUsers = [...mockUserData];
      mockPrisma.user.findMany.mockResolvedValueOnce(expectedUsers);

      const result = await userRepository.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        include: { address: true },
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toEqual(expectedUsers);
    });

    it('should return empty array when no users found', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      const result = await userRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    it('should update user successfully', async () => {
      const updatedUser = {
        ...mockUserData[0],
        ...updateData,
        updatedAt: new Date()
      };
      
      mockPrisma.user.update.mockResolvedValueOnce(updatedUser);

      const result = await userRepository.update('user-1', updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateData,
        include: { address: true }
      });

      expect(result).toEqual(updatedUser);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const userToDelete = mockUserData[0];
      
      mockPrisma.user.findUnique.mockResolvedValueOnce(userToDelete);
      mockPrisma.user.delete.mockResolvedValueOnce(userToDelete);

      await userRepository.delete('user-1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' }
      });
    });
  });
}); 