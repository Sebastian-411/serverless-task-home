import {
  validateEmail,
  validatePassword,
  validateUUID,
  validateRequired,
  validateLength,
  validateEnum,
  validateNumber
} from '../../../../../../core/common/config/middlewares/validation.middleware';

describe('Validation Middleware', () => {
  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should handle case insensitive validation', () => {
      // Arrange
      const mixedCaseEmail = 'Test@Example.COM';

      // Act & Assert
      expect(validateEmail(mixedCaseEmail)).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid passwords', () => {
      const validPasswords = [
        'Password123',
        'SecurePass1',
        'MyP@ssw0rd'
      ];

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
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
        expect(validatePassword(password)).toBe(false);
      });
    });

    it('should require minimum 8 characters', () => {
      // Arrange
      const shortPassword = 'Pass1'; // 5 characters

      // Act & Assert
      expect(validatePassword(shortPassword)).toBe(false);
    });

    it('should require at least one uppercase letter', () => {
      // Arrange
      const noUppercase = 'password123';

      // Act & Assert
      expect(validatePassword(noUppercase)).toBe(false);
    });

    it('should require at least one lowercase letter', () => {
      // Arrange
      const noLowercase = 'PASSWORD123';

      // Act & Assert
      expect(validatePassword(noLowercase)).toBe(false);
    });

    it('should require at least one number', () => {
      // Arrange
      const noNumbers = 'Password';

      // Act & Assert
      expect(validatePassword(noNumbers)).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('should return true for valid UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000'
      ];

      validUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(true);
      });
    });

    it('should return false for invalid UUIDs', () => {
      const invalidUUIDs = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456-42661417400'
      ];

      invalidUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(false);
      });
    });

    it('should handle case insensitive validation', () => {
      // Arrange
      const uppercaseUUID = '123E4567-E89B-12D3-A456-426614174000';

      // Act & Assert
      expect(validateUUID(uppercaseUUID)).toBe(true);
    });
  });

  describe('validateRequired', () => {
    it('should return true for valid values', () => {
      expect(validateRequired('string')).toBe(true);
      expect(validateRequired(123)).toBe(true);
      expect(validateRequired(0)).toBe(true);
    });

    it('should return false for null/undefined/empty values', () => {
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
      expect(validateRequired('')).toBe(false);
    });

    it('should handle whitespace strings', () => {
      // Arrange
      const whitespaceStrings = [
        ' ',
        '  ',
        '\t',
        '\n',
        '\r'
      ];

      // Act & Assert
      whitespaceStrings.forEach(value => {
        expect(validateRequired(value)).toBe(true); // Whitespace is considered valid
      });
    });
  });

  describe('validateLength', () => {
    it('should return true for valid lengths', () => {
      const testString = 'test';
      expect(validateLength(testString, 1, 10)).toBe(true);
      expect(validateLength(testString, 4, 4)).toBe(true);
    });

    it('should return false for invalid lengths', () => {
      const testString = 'test';
      expect(validateLength(testString, 5, 10)).toBe(false);
      expect(validateLength(testString, 1, 3)).toBe(false);
    });

    it('should handle edge cases', () => {
      // Arrange
      const emptyString = '';
      const longString = 'a'.repeat(100);

      // Act & Assert
      expect(validateLength(emptyString, 0, 10)).toBe(true);
      expect(validateLength(emptyString, 1, 10)).toBe(false);
      expect(validateLength(longString, 1, 50)).toBe(false);
      expect(validateLength(longString, 1, 100)).toBe(true);
    });

    it('should handle null/undefined values', () => {
      // Act & Assert
      expect(validateLength(null as any, 1, 10)).toBe(false);
      expect(validateLength(undefined as any, 1, 10)).toBe(false);
    });
  });

  describe('validateEnum', () => {
    it('should return true for valid enum values', () => {
      const allowedValues = ['value1', 'value2', 'value3'] as const;
      expect(validateEnum('value1', allowedValues)).toBe(true);
      expect(validateEnum('value2', allowedValues)).toBe(true);
    });

    it('should return false for invalid enum values', () => {
      const allowedValues = ['value1', 'value2', 'value3'] as const;
      expect(validateEnum('invalid', allowedValues)).toBe(false);
      expect(validateEnum('value4', allowedValues)).toBe(false);
    });

    it('should handle empty allowed values array', () => {
      // Arrange
      const allowedValues = [] as const;

      // Act & Assert
      expect(validateEnum('any', allowedValues)).toBe(false);
    });

    it('should handle single allowed value', () => {
      // Arrange
      const allowedValues = ['single'] as const;

      // Act & Assert
      expect(validateEnum('single', allowedValues)).toBe(true);
      expect(validateEnum('other', allowedValues)).toBe(false);
    });

    it('should handle case sensitive validation', () => {
      // Arrange
      const allowedValues = ['Value1', 'Value2'] as const;

      // Act & Assert
      expect(validateEnum('Value1', allowedValues)).toBe(true);
      expect(validateEnum('value1', allowedValues)).toBe(false);
    });
  });

  describe('validateNumber', () => {
    it('should return true for valid numbers', () => {
      expect(validateNumber(123)).toBe(true);
      expect(validateNumber(0)).toBe(true);
      expect(validateNumber(-123)).toBe(true);
    });

    it('should return false for invalid numbers', () => {
      expect(validateNumber(NaN)).toBe(false);
      expect(validateNumber('123' as any)).toBe(false);
    });

    it('should validate min constraint', () => {
      expect(validateNumber(5, 1)).toBe(true);
      expect(validateNumber(0, 1)).toBe(false);
    });

    it('should validate max constraint', () => {
      expect(validateNumber(5, undefined, 10)).toBe(true);
      expect(validateNumber(15, undefined, 10)).toBe(false);
    });

    describe('with both min and max constraints', () => {
      it('should return true for numbers within range', () => {
        // Act & Assert
        expect(validateNumber(5, 1, 10)).toBe(true);
        expect(validateNumber(1, 1, 10)).toBe(true);
        expect(validateNumber(10, 1, 10)).toBe(true);
      });

      it('should return false for numbers outside range', () => {
        // Act & Assert
        expect(validateNumber(0, 1, 10)).toBe(false);
        expect(validateNumber(11, 1, 10)).toBe(false);
        expect(validateNumber(-1, 0, 5)).toBe(false);
        expect(validateNumber(6, 0, 5)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      // Act & Assert
      expect(validateNumber(0, 0, 0)).toBe(true);
      expect(validateNumber(0, 1, 1)).toBe(false);
      expect(validateNumber(1, 1, 1)).toBe(true);
    });
  });
}); 