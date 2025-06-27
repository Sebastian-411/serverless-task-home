/**
 * User Entity Domain Tests
 * Comprehensive testing for User domain entity with >80% coverage
 */

import { User, ValidationError, UserData, CreateUserData, UpdateUserData } from '../../../../../core/user/domain/user.entity';

describe('User Entity Domain Tests', () => {
  const validUserData: UserData = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    address: {
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      stateOrProvince: 'NY',
      postalCode: '10001',
      country: 'USA'
    },
    role: 'USER' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const validCreateUserData: CreateUserData = {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phoneNumber: '+1987654321',
    address: {
      addressLine1: '456 Oak Ave',
      city: 'Boston',
      stateOrProvince: 'MA',
      postalCode: '02101',
      country: 'USA'
    },
    role: 'ADMIN'
  };

  describe('User Constructor', () => {
    it('should create a user with valid data', () => {
      const user = new User(validUserData);

      expect(user.id).toBe(validUserData.id);
      expect(user.name).toBe(validUserData.name);
      expect(user.email).toBe(validUserData.email);
      expect(user.phoneNumber).toBe(validUserData.phoneNumber);
      expect(user.address).toEqual(validUserData.address);
      expect(user.role).toBe(validUserData.role);
      expect(user.createdAt).toEqual(validUserData.createdAt);
      expect(user.updatedAt).toEqual(validUserData.updatedAt);
    });

    it('should throw ValidationError for invalid ID', () => {
      const invalidData = { ...validUserData, id: 'invalid-id' };
      
      expect(() => new User(invalidData)).toThrow(ValidationError);
      expect(() => new User(invalidData)).toThrow('Invalid user ID format');
    });

    it('should throw ValidationError for empty name', () => {
      const invalidData = { ...validUserData, name: '' };
      
      expect(() => new User(invalidData)).toThrow(ValidationError);
      expect(() => new User(invalidData)).toThrow('Name is required');
    });

    it('should throw ValidationError for name too long', () => {
      const invalidData = { ...validUserData, name: 'a'.repeat(101) };
      
      expect(() => new User(invalidData)).toThrow(ValidationError);
      expect(() => new User(invalidData)).toThrow('Name must be between 1 and 100 characters');
    });

    it('should throw ValidationError for invalid email', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      expect(() => new User(invalidData)).toThrow(ValidationError);
      expect(() => new User(invalidData)).toThrow('Invalid email format');
    });

    it('should throw ValidationError for email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const invalidData = { ...validUserData, email: longEmail };
      
      expect(() => new User(invalidData)).toThrow(ValidationError);
      expect(() => new User(invalidData)).toThrow('Email must be less than 255 characters');
    });

    it('should throw ValidationError for invalid phone number', () => {
      const invalidData = { ...validUserData, phoneNumber: '123' };
      
      expect(() => new User(invalidData)).toThrow(ValidationError);
      expect(() => new User(invalidData)).toThrow('Invalid phone number format');
    });

    it('should throw ValidationError for invalid role', () => {
      const invalidData = { ...validUserData, role: 'INVALID' as any };
      
      expect(() => new User(invalidData)).toThrow(ValidationError);
      expect(() => new User(invalidData)).toThrow('Invalid role. Must be ADMIN or USER');
    });

    it('should normalize email to lowercase', () => {
      const dataWithUpperEmail = { ...validUserData, email: 'JOHN.DOE@EXAMPLE.COM' };
      const user = new User(dataWithUpperEmail);
      
      expect(user.email).toBe('john.doe@example.com');
    });

    it('should trim whitespace from name', () => {
      const dataWithSpaces = { ...validUserData, name: '  John Doe  ' };
      const user = new User(dataWithSpaces);
      
      expect(user.name).toBe('John Doe');
    });

    it('should handle null address', () => {
      const dataWithNullAddress = { ...validUserData, address: null };
      const user = new User(dataWithNullAddress);
      
      expect(user.address).toBeNull();
    });

    it('should handle undefined address', () => {
      const dataWithUndefinedAddress = { ...validUserData, address: undefined };
      const user = new User(dataWithUndefinedAddress);
      
      expect(user.address).toBeNull();
    });
  });

  describe('User.create Factory Method', () => {
    it('should create a new user with default role USER', () => {
      const createData = { ...validCreateUserData };
      delete createData.role;
      
      const user = User.create(createData);
      
      expect(user.name).toBe(createData.name);
      expect(user.email).toBe(createData.email);
      expect(user.phoneNumber).toBe(createData.phoneNumber);
      expect(user.address).toEqual(createData.address);
      expect(user.role).toBe('USER');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeValidDate();
      expect(user.updatedAt).toBeValidDate();
    });

    it('should create a new user with specified role', () => {
      const user = User.create(validCreateUserData);
      
      expect(user.role).toBe('ADMIN');
    });

    it('should generate unique IDs for different users', () => {
      const user1 = User.create(validCreateUserData);
      const user2 = User.create(validCreateUserData);
      
      expect(user1.id).not.toBe(user2.id);
    });

    it('should handle missing address in create data', () => {
      const createDataWithoutAddress = { ...validCreateUserData };
      delete createDataWithoutAddress.address;
      
      const user = User.create(createDataWithoutAddress);
      
      expect(user.address).toBeNull();
    });
  });

  describe('User.fromObject Factory Method', () => {
    it('should create user from existing data', () => {
      const user = User.fromObject(validUserData);
      
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(validUserData.id);
      expect(user.name).toBe(validUserData.name);
      expect(user.email).toBe(validUserData.email);
    });
  });

  describe('User Methods', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserData);
    });

    describe('validate', () => {
      it('should return true for valid user', () => {
        expect(user.validate()).toBe(true);
      });
    });

    describe('isAdmin', () => {
      it('should return true for admin user', () => {
        const adminUser = new User({ ...validUserData, role: 'ADMIN' });
        expect(adminUser.isAdmin()).toBe(true);
      });

      it('should return false for regular user', () => {
        expect(user.isAdmin()).toBe(false);
      });
    });

    describe('isRegularUser', () => {
      it('should return true for regular user', () => {
        expect(user.isRegularUser()).toBe(true);
      });

      it('should return false for admin user', () => {
        const adminUser = new User({ ...validUserData, role: 'ADMIN' });
        expect(adminUser.isRegularUser()).toBe(false);
      });
    });

    describe('update', () => {
      it('should update name successfully', () => {
        const updates: UpdateUserData = { name: 'Updated Name' };
        const originalUpdatedAt = user.updatedAt;
        
        // Wait to ensure different timestamp
        jest.advanceTimersByTime(1000);
        
        const updatedUser = user.update(updates);
        
        expect(updatedUser.name).toBe('Updated Name');
        expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        expect(updatedUser).toBe(user); // Should return same instance
      });

      it('should update email successfully', () => {
        const updates: UpdateUserData = { email: 'new.email@example.com' };
        
        user.update(updates);
        
        expect(user.email).toBe('new.email@example.com');
      });

      it('should update phone number successfully', () => {
        const updates: UpdateUserData = { phoneNumber: '+1111111111' };
        
        user.update(updates);
        
        expect(user.phoneNumber).toBe('+1111111111');
      });

      it('should update address successfully', () => {
        const newAddress = {
          addressLine1: '789 New St',
          city: 'Chicago',
          stateOrProvince: 'IL',
          postalCode: '60601',
          country: 'USA'
        };
        const updates: UpdateUserData = { address: newAddress };
        
        user.update(updates);
        
        expect(user.address).toEqual(newAddress);
      });

      it('should update role successfully', () => {
        const updates: UpdateUserData = { role: 'ADMIN' };
        
        user.update(updates);
        
        expect(user.role).toBe('ADMIN');
      });

      it('should handle multiple updates at once', () => {
        const updates: UpdateUserData = {
          name: 'Multi Update',
          email: 'multi@example.com',
          role: 'ADMIN'
        };
        
        user.update(updates);
        
        expect(user.name).toBe('Multi Update');
        expect(user.email).toBe('multi@example.com');
        expect(user.role).toBe('ADMIN');
      });

      it('should ignore undefined values', () => {
        const originalName = user.name;
        const updates: UpdateUserData = { name: undefined };
        
        user.update(updates);
        
        expect(user.name).toBe(originalName);
      });

      it('should throw ValidationError for invalid updates', () => {
        const updates: UpdateUserData = { email: 'invalid-email' };
        
        expect(() => user.update(updates)).toThrow(ValidationError);
      });
    });

    describe('toJSON', () => {
      it('should return complete user data', () => {
        const json = user.toJSON();
        
        expect(json).toEqual({
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      });

      it('should return serializable object', () => {
        const json = user.toJSON();
        
        expect(() => JSON.stringify(json)).not.toThrow();
      });
    });

    describe('toSafeObject', () => {
      it('should return user data without email', () => {
        const safeObj = user.toSafeObject();
        
        expect(safeObj).toEqual({
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          address: user.address,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
        expect(safeObj).not.toHaveProperty('email');
      });
    });

    describe('fromPrisma', () => {
      it('should create user from Prisma data with address', () => {
        const prismaData = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Prisma User',
          email: 'prisma@example.com',
          phoneNumber: '+1234567890',
          role: 'USER',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          address: {
            addressLine1: '123 Prisma St',
            addressLine2: null,
            city: 'Prisma City',
            stateOrProvince: 'PC',
            postalCode: '12345',
            country: 'Prisma Country'
          }
        };
        
        const user = User.fromPrisma(prismaData);
        
        expect(user).toBeInstanceOf(User);
        expect(user.id).toBe(prismaData.id);
        expect(user.name).toBe(prismaData.name);
        expect(user.address).toEqual({
          addressLine1: '123 Prisma St',
          addressLine2: undefined,
          city: 'Prisma City',
          stateOrProvince: 'PC',
          postalCode: '12345',
          country: 'Prisma Country'
        });
      });

      it('should create user from Prisma data without address', () => {
        const prismaData = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Prisma User',
          email: 'prisma@example.com',
          phoneNumber: '+1234567890',
          role: 'USER',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          address: null
        };
        
        const user = User.fromPrisma(prismaData);
        
        expect(user.address).toBeNull();
      });
    });

    describe('toPrisma', () => {
      it('should convert user to Prisma format', () => {
        const prismaData = user.toPrisma();
        
        expect(prismaData).toEqual({
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          address: {
            create: user.address
          }
        });
      });

      it('should include address as create object in Prisma format', () => {
        const prismaData = user.toPrisma();
        
        expect(prismaData).toHaveProperty('address');
        expect(prismaData.address).toEqual({
          create: user.address
        });
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle Date objects passed as strings', () => {
      const dataWithStringDates = {
        ...validUserData,
        createdAt: '2024-01-01T00:00:00Z' as any,
        updatedAt: '2024-01-01T00:00:00Z' as any
      };
      
      const user = new User(dataWithStringDates);
      
      expect(user.createdAt).toBeValidDate();
      expect(user.updatedAt).toBeValidDate();
    });

    it('should handle various phone number formats', () => {
      const validPhoneFormats = [
        '+1234567890',
        '+1-234-567-8900',
        '+1 (234) 567-8900',
        '1234567890',
        '(234) 567-8900'
      ];
      
      validPhoneFormats.forEach(phone => {
        const userData = { ...validUserData, phoneNumber: phone };
        expect(() => new User(userData)).not.toThrow();
      });
    });

    it('should reject invalid phone number formats', () => {
      const invalidPhoneFormats = [
        '123',
        'abc',
        '+',
        '123-456-789012345678901234567890' // too long
      ];
      
      invalidPhoneFormats.forEach(phone => {
        const userData = { ...validUserData, phoneNumber: phone };
        expect(() => new User(userData)).toThrow(ValidationError);
      });
    });

    it('should handle various UUID formats', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ];
      
      validUUIDs.forEach(id => {
        const userData = { ...validUserData, id };
        expect(() => new User(userData)).not.toThrow();
      });
    });

    it('should handle empty string inputs appropriately', () => {
      expect(() => new User({ ...validUserData, name: '' })).toThrow();
      expect(() => new User({ ...validUserData, email: '' })).toThrow();
      expect(() => new User({ ...validUserData, phoneNumber: '' })).toThrow();
    });
  });
}); 