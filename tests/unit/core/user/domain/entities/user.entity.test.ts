import { User, UserRole } from '@/core/user/domain/entities/user.entity';
import { ValidationError } from '@/core/common/domain/exceptions/validation.error';

describe('User Entity', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'Password123',
    name: 'Test User',
    role: UserRole.USER,
    phoneNumber: '+1234567890',
    address: {
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      stateOrProvince: 'NY',
      postalCode: '10001',
      country: 'USA'
    }
  };

  describe('constructor', () => {
    it('should create user with valid data', () => {
      // Act
      const user = new User(validUserData);

      // Assert
      expect(user.email).toBe(validUserData.email.toLowerCase());
      expect(user.password).toBe(validUserData.password);
      expect(user.name).toBe(validUserData.name);
      expect(user.role).toBe(validUserData.role);
      expect(user.phoneNumber).toBe(validUserData.phoneNumber);
      expect(user.address).toEqual(validUserData.address);
      expect(user.isActive).toBe(true);
      expect(user.emailVerified).toBe(false);
    });

    it('should create user with generated ID when not provided', () => {
      // Act
      const user = new User(validUserData);

      // Assert
      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('string');
      expect(user.id.length).toBeGreaterThan(0);
    });

    it('should create user with provided ID', () => {
      // Arrange
      const providedId = 'user-123';
      const userDataWithId = { ...validUserData, id: providedId };

      // Act
      const user = new User(userDataWithId);

      // Assert
      expect(user.id).toBe(providedId);
    });

    it('should normalize email to lowercase', () => {
      // Arrange
      const userDataWithUpperCaseEmail = {
        ...validUserData,
        email: 'TEST@EXAMPLE.COM'
      };

      // Act
      const user = new User(userDataWithUpperCaseEmail);

      // Assert
      expect(user.email).toBe('test@example.com');
    });

    it('should trim name', () => {
      // Arrange
      const userDataWithWhitespace = {
        ...validUserData,
        name: '  Test User  '
      };

      // Act
      const user = new User(userDataWithWhitespace);

      // Assert
      expect(user.name).toBe('Test User');
    });

    it('should set default values', () => {
      // Arrange
      const minimalUserData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User'
      };

      // Act
      const user = new User(minimalUserData);

      // Assert
      expect(user.role).toBe(UserRole.USER);
      expect(user.isActive).toBe(true);
      expect(user.emailVerified).toBe(false);
      expect(user.phoneNumber).toBeUndefined();
      expect(user.address).toBeUndefined();
    });

    it('should throw ValidationError for invalid email', () => {
      // Arrange
      const invalidEmailData = {
        ...validUserData,
        email: 'invalid-email'
      };

      // Act & Assert
      expect(() => new User(invalidEmailData)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid password', () => {
      // Arrange
      const invalidPasswordData = {
        ...validUserData,
        password: 'weak'
      };

      // Act & Assert
      expect(() => new User(invalidPasswordData)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid name', () => {
      // Arrange
      const invalidNameData = {
        ...validUserData,
        name: ''
      };

      // Act & Assert
      expect(() => new User(invalidNameData)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid role', () => {
      // Arrange
      const invalidRoleData = {
        ...validUserData,
        role: 'invalid-role' as any
      };

      // Act & Assert
      expect(() => new User(invalidRoleData)).toThrow(ValidationError);
    });
  });

  describe('getters', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserData);
    });

    it('should return correct email', () => {
      expect(user.email).toBe('test@example.com');
    });

    it('should return correct password', () => {
      expect(user.password).toBe('Password123');
    });

    it('should return correct name', () => {
      expect(user.name).toBe('Test User');
    });

    it('should return correct role', () => {
      expect(user.role).toBe(UserRole.USER);
    });

    it('should return correct phone number', () => {
      expect(user.phoneNumber).toBe('+1234567890');
    });

    it('should return correct address', () => {
      expect(user.address).toEqual(validUserData.address);
    });

    it('should return correct isActive status', () => {
      expect(user.isActive).toBe(true);
    });

    it('should return correct emailVerified status', () => {
      expect(user.emailVerified).toBe(false);
    });

    it('should return correct lastLoginAt', () => {
      expect(user.lastLoginAt).toBeUndefined();
    });

    it('should return correct isAdmin status', () => {
      expect(user.isAdmin).toBe(false);
    });

    it('should return true for admin user', () => {
      // Arrange
      const adminUser = new User({
        ...validUserData,
        role: UserRole.ADMIN
      });

      // Assert
      expect(adminUser.isAdmin).toBe(true);
    });
  });

  describe('setters', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserData);
    });

    describe('setEmail', () => {
      it('should update email with valid value', () => {
        // Arrange
        const newEmail = 'new@example.com';

        // Act
        user.setEmail(newEmail);

        // Assert
        expect(user.email).toBe(newEmail.toLowerCase());
      });

      it('should throw ValidationError for invalid email', () => {
        // Act & Assert
        expect(() => user.setEmail('invalid-email')).toThrow(ValidationError);
      });

      it('should update timestamp', () => {
        // Arrange
        const originalUpdatedAt = user.updatedAt;

        // Wait a bit to ensure time difference
        const waitTime = 10;
        const startTime = Date.now();
        while (Date.now() - startTime < waitTime) {
          // Wait
        }

        // Act
        user.setEmail('new@example.com');

        // Assert
        expect(new Date(user.updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
      });
    });

    describe('setPassword', () => {
      it('should update password with valid value', () => {
        // Arrange
        const newPassword = 'NewPassword123';

        // Act
        user.setPassword(newPassword);

        // Assert
        expect(user.password).toBe(newPassword);
      });

      it('should throw ValidationError for invalid password', () => {
        // Act & Assert
        expect(() => user.setPassword('weak')).toThrow(ValidationError);
      });
    });

    describe('setName', () => {
      it('should update name with valid value', () => {
        // Arrange
        const newName = 'New Name';

        // Act
        user.setName(newName);

        // Assert
        expect(user.name).toBe(newName);
      });

      it('should throw ValidationError for invalid name', () => {
        // Act & Assert
        expect(() => user.setName('')).toThrow(ValidationError);
      });
    });

    describe('setRole', () => {
      it('should update role with valid value', () => {
        // Act
        user.setRole(UserRole.ADMIN);

        // Assert
        expect(user.role).toBe(UserRole.ADMIN);
        expect(user.isAdmin).toBe(true);
      });

      it('should throw ValidationError for invalid role', () => {
        // Act & Assert
        expect(() => user.setRole('invalid' as any)).toThrow(ValidationError);
      });
    });

    describe('setPhoneNumber', () => {
      it('should update phone number with valid value', () => {
        // Arrange
        const newPhone = '+9876543210';

        // Act
        user.setPhoneNumber(newPhone);

        // Assert
        expect(user.phoneNumber).toBe(newPhone);
      });

      it('should throw ValidationError for invalid phone number', () => {
        // Act & Assert
        expect(() => user.setPhoneNumber('123')).toThrow(ValidationError);
      });
    });

    describe('setAddress', () => {
      it('should update address', () => {
        // Arrange
        const newAddress = {
          addressLine1: '456 New St',
          city: 'Los Angeles',
          stateOrProvince: 'CA',
          postalCode: '90210',
          country: 'USA'
        };

        // Act
        user.setAddress(newAddress);

        // Assert
        expect(user.address).toEqual(newAddress);
      });
    });

    describe('setActive', () => {
      it('should update active status', () => {
        // Act
        user.setActive(false);

        // Assert
        expect(user.isActive).toBe(false);
      });
    });

    describe('setEmailVerified', () => {
      it('should update email verified status', () => {
        // Act
        user.setEmailVerified(true);

        // Assert
        expect(user.emailVerified).toBe(true);
      });
    });

    describe('setLastLoginAt', () => {
      it('should update last login timestamp', () => {
        // Arrange
        const timestamp = '2024-01-01T00:00:00Z';

        // Act
        user.setLastLoginAt(timestamp);

        // Assert
        expect(user.lastLoginAt).toBe(timestamp);
      });
    });
  });

  describe('business methods', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserData);
    });

    describe('updateLastLogin', () => {
      it('should update last login timestamp', () => {
        // Arrange
        const beforeUpdate = new Date();

        // Act
        user.updateLastLogin();

        // Assert
        const afterUpdate = new Date();
        expect(user.lastLoginAt).toBeDefined();
        expect(new Date(user.lastLoginAt!).getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        expect(new Date(user.lastLoginAt!).getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
      });
    });

    describe('activate', () => {
      it('should activate user', () => {
        // Arrange
        user.setActive(false);

        // Act
        user.activate();

        // Assert
        expect(user.isActive).toBe(true);
      });
    });

    describe('deactivate', () => {
      it('should deactivate user', () => {
        // Act
        user.deactivate();

        // Assert
        expect(user.isActive).toBe(false);
      });
    });

    describe('verifyEmail', () => {
      it('should verify email', () => {
        // Act
        user.verifyEmail();

        // Assert
        expect(user.emailVerified).toBe(true);
      });
    });

    describe('promoteToAdmin', () => {
      it('should promote user to admin', () => {
        // Act
        user.promoteToAdmin();

        // Assert
        expect(user.role).toBe(UserRole.ADMIN);
        expect(user.isAdmin).toBe(true);
      });
    });

    describe('demoteToUser', () => {
      it('should demote admin to user', () => {
        // Arrange
        user.promoteToAdmin();

        // Act
        user.demoteToUser();

        // Assert
        expect(user.role).toBe(UserRole.USER);
        expect(user.isAdmin).toBe(false);
      });
    });
  });

  describe('utility methods', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserData);
    });

    describe('equals', () => {
      it('should return true for same user', () => {
        // Arrange
        const sameUser = new User({ ...validUserData, id: user.id });

        // Act & Assert
        expect(user.equals(sameUser)).toBe(true);
      });

      it('should return false for different users', () => {
        // Arrange
        const user = new User({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User'
        });
        const differentUser = new User({
          email: 'different@example.com',
          password: 'Password123',
          name: 'Different User'
        });

        // Act & Assert
        expect(user.equals(differentUser)).toBe(false);
      });

      it('should return false for non-user objects', () => {
        // Arrange
        const nonUser = { id: user.id };

        // Act & Assert
        expect(user.equals(nonUser as any)).toBe(false);
      });
    });

    describe('hasSameEmail', () => {
      it('should return true for same email', () => {
        // Arrange
        const sameEmailUser = new User({
          ...validUserData,
          email: 'test@example.com'
        });

        // Act & Assert
        expect(user.hasSameEmail(sameEmailUser)).toBe(true);
      });

      it('should return false for different email', () => {
        // Arrange
        const differentEmailUser = new User({
          ...validUserData,
          email: 'other@example.com'
        });

        // Act & Assert
        expect(user.hasSameEmail(differentEmailUser)).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('should return user as plain object', () => {
        // Act
        const json = user.toJSON();

        // Assert
        expect(json).toEqual({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phoneNumber: user.phoneNumber,
          address: user.address,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      });
    });

    describe('toSafeJSON', () => {
      it('should return user as plain object without password', () => {
        // Act
        const safeJson = user.toSafeJSON();

        // Assert
        expect(safeJson).toEqual({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phoneNumber: user.phoneNumber,
          address: user.address,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
        expect(safeJson).not.toHaveProperty('password');
      });
    });

    describe('validate', () => {
      it('should not throw for valid user', () => {
        // Act & Assert
        expect(() => user.validate()).not.toThrow();
      });

      it('should throw ValidationError for invalid user', () => {
        // Arrange
        const invalidUser = new User({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User'
        });
        
        // Mock the validation methods to throw
        jest.spyOn(invalidUser as any, '_validateEmail').mockImplementation(() => {
          throw new ValidationError('Invalid email format');
        });

        // Act & Assert
        expect(() => invalidUser.validate()).toThrow(ValidationError);
        expect(() => invalidUser.validate()).toThrow('Invalid email format');
      });
    });
  });

  describe('static methods', () => {
    describe('create', () => {
      it('should create user with factory method', () => {
        // Act
        const user = User.create(validUserData);

        // Assert
        expect(user).toBeInstanceOf(User);
        expect(user.email).toBe(validUserData.email.toLowerCase());
      });
    });

    describe('createAdmin', () => {
      it('should create admin user', () => {
        // Arrange
        const { role, ...userDataWithoutRole } = validUserData;

        // Act
        const adminUser = User.createAdmin(userDataWithoutRole);

        // Assert
        expect(adminUser.role).toBe(UserRole.ADMIN);
        expect(adminUser.isAdmin).toBe(true);
      });
    });

    describe('isValidEmail', () => {
      it('should return true for valid emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org'
        ];

        validEmails.forEach(email => {
          expect(User.isValidEmail(email)).toBe(true);
        });
      });

      it('should return false for invalid emails', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'test@',
          'test.example.com',
          'a'.repeat(256) + '@example.com' // Too long
        ];

        invalidEmails.forEach(email => {
          expect(User.isValidEmail(email)).toBe(false);
        });
      });
    });

    describe('isValidPassword', () => {
      it('should return true for valid passwords', () => {
        const validPasswords = [
          'Password123',
          'SecurePass1',
          'MyP@ssw0rd'
        ];

        validPasswords.forEach(password => {
          expect(User.isValidPassword(password)).toBe(true);
        });
      });

      it('should return false for invalid passwords', () => {
        const invalidPasswords = [
          'short',
          'nouppercase123',
          'NOLOWERCASE123',
          'NoNumbers'
        ];

        invalidPasswords.forEach(password => {
          expect(User.isValidPassword(password)).toBe(false);
        });
      });
    });

    describe('normalizeEmail', () => {
      it('should normalize email to lowercase and trim', () => {
        expect(User.normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      });
    });

    describe('normalizeName', () => {
      it('should trim name', () => {
        expect(User.normalizeName('  Test User  ')).toBe('Test User');
      });
    });
  });
}); 