import { Email } from '../../../../../../core/common/domain/value-objects/email.vo';
import { ValidationError } from '../../../../../../core/common/domain/exceptions/validation.error';

describe('Email Value Object', () => {
  describe('constructor', () => {
    it('should create email with valid address', () => {
      // Arrange
      const validEmail = 'test@example.com';

      // Act
      const email = new Email(validEmail);

      // Assert
      expect(email.value).toBe(validEmail.toLowerCase());
    });

    it('should normalize email to lowercase', () => {
      // Arrange
      const mixedCaseEmail = 'Test@Example.COM';

      // Act
      const email = new Email(mixedCaseEmail);

      // Assert
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      // Arrange
      const emailWithWhitespace = '  test@example.com  ';

      // Act
      const email = new Email(emailWithWhitespace);

      // Assert
      expect(email.value).toBe('test@example.com');
    });

    it('should throw ValidationError for null email', () => {
      // Act & Assert
      expect(() => new Email(null as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined email', () => {
      // Act & Assert
      expect(() => new Email(undefined as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string', () => {
      // Act & Assert
      expect(() => new Email('')).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string value', () => {
      // Act & Assert
      expect(() => new Email(123 as any)).toThrow(ValidationError);
      expect(() => new Email({} as any)).toThrow(ValidationError);
      expect(() => new Email([] as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email format', () => {
      // Arrange & Act & Assert
      expect(() => new Email('invalid-email')).toThrow(ValidationError);
      expect(() => new Email('@example.com')).toThrow(ValidationError);
      expect(() => new Email('test@')).toThrow(ValidationError);
      expect(() => new Email('test@.com')).toThrow(ValidationError);
      expect(() => new Email('test@example.')).toThrow(ValidationError);
      expect(() => new Email('test@@example.com')).toThrow(ValidationError);
      expect(() => new Email('test@example')).toThrow(ValidationError);
      expect(() => new Email('test.example.com')).toThrow(ValidationError);
    });

    it('should throw ValidationError for email too long', () => {
      // Arrange
      const longEmail = 'a'.repeat(255) + '@example.com';

      // Act & Assert
      expect(() => new Email(longEmail)).toThrow(ValidationError);
    });

    it('should accept valid email formats', () => {
      // Arrange
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'user@subdomain.example.com',
        'user@example.co.jp',
        'user@example-domain.com',
        'user@example.com',
        'user@example-domain.co.uk'
      ];

      // Act & Assert
      validEmails.forEach(validEmail => {
        expect(() => new Email(validEmail)).not.toThrow();
      });
    });

    it('should accept email with maximum allowed length', () => {
      // Arrange - 254 characters total (including @ and domain)
      const maxLengthEmail = 'a'.repeat(240) + '@example.com';

      // Act & Assert
      expect(() => new Email(maxLengthEmail)).not.toThrow();
    });
  });

  describe('getters', () => {
    let email: Email;

    beforeEach(() => {
      email = new Email('test@example.com');
    });

    describe('value', () => {
      it('should return normalized email value', () => {
        // Assert
        expect(email.value).toBe('test@example.com');
      });
    });

    describe('domain', () => {
      it('should return email domain', () => {
        // Assert
        expect(email.domain).toBe('example.com');
      });

      it('should handle complex domains', () => {
        // Arrange
        const complexEmail = new Email('user@subdomain.example.co.uk');

        // Assert
        expect(complexEmail.domain).toBe('subdomain.example.co.uk');
      });

      it('should handle domain with numbers', () => {
        // Arrange
        const emailWithNumbers = new Email('user@example123.com');

        // Assert
        expect(emailWithNumbers.domain).toBe('example123.com');
      });
    });

    describe('username', () => {
      it('should return email username', () => {
        // Assert
        expect(email.username).toBe('test');
      });

      it('should handle complex usernames', () => {
        // Arrange
        const complexEmail = new Email('user.name+tag@example.com');

        // Assert
        expect(complexEmail.username).toBe('user.name+tag');
      });

      it('should handle username with numbers', () => {
        // Arrange
        const emailWithNumbers = new Email('user123@example.com');

        // Assert
        expect(emailWithNumbers.username).toBe('user123');
      });
    });
  });

  describe('equals', () => {
    it('should return true for same email', () => {
      // Arrange
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');

      // Act & Assert
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for same email with different case', () => {
      // Arrange
      const email1 = new Email('test@example.com');
      const email2 = new Email('TEST@EXAMPLE.COM');

      // Act & Assert
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      // Arrange
      const email1 = new Email('test@example.com');
      const email2 = new Email('other@example.com');

      // Act & Assert
      expect(email1.equals(email2)).toBe(false);
    });

    it('should return false for null comparison', () => {
      // Arrange
      const email = new Email('test@example.com');

      // Act & Assert
      expect(email.equals(null as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return email value as string', () => {
      // Arrange
      const email = new Email('test@example.com');

      // Act
      const result = email.toString();

      // Assert
      expect(result).toBe('test@example.com');
    });
  });

  describe('toJSON', () => {
    it('should return email value', () => {
      // Arrange
      const email = new Email('test@example.com');

      // Act
      const result = email.toJSON();

      // Assert
      expect(result).toBe('test@example.com');
    });
  });

  describe('static methods', () => {
    describe('isValid', () => {
      it('should return true for valid emails', () => {
        // Arrange
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com'
        ];

        // Act & Assert
        validEmails.forEach(validEmail => {
          expect(Email.isValid(validEmail)).toBe(true);
        });
      });

      it('should return false for invalid emails', () => {
        // Arrange
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'test@',
          'test.example.com',
          '',
          null,
          undefined
        ];

        // Act & Assert
        invalidEmails.forEach(invalidEmail => {
          expect(Email.isValid(invalidEmail as any)).toBe(false);
        });
      });

      it('should return false for emails too long', () => {
        // Arrange
        const longEmail = 'a'.repeat(255) + '@example.com';

        // Act & Assert
        expect(Email.isValid(longEmail)).toBe(false);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle email with maximum valid length', () => {
      // Arrange - 254 characters total (including @ and domain)
      const maxLengthEmail = 'a'.repeat(240) + '@example.com';

      // Act & Assert
      expect(() => new Email(maxLengthEmail)).not.toThrow();
    });

    it('should handle email with special characters in username', () => {
      // Arrange
      const specialCharsEmail = 'user.name+tag-123@example.com';

      // Act
      const email = new Email(specialCharsEmail);

      // Assert
      expect(email.value).toBe('user.name+tag-123@example.com');
      expect(email.username).toBe('user.name+tag-123');
    });

    it('should handle email with multiple dots in domain', () => {
      // Arrange
      const multiDotEmail = 'user@sub.domain.example.com';

      // Act
      const email = new Email(multiDotEmail);

      // Assert
      expect(email.value).toBe('user@sub.domain.example.com');
      expect(email.domain).toBe('sub.domain.example.com');
    });

    it('should handle email with numbers in domain', () => {
      // Arrange
      const numericDomainEmail = 'user@example123.com';

      // Act
      const email = new Email(numericDomainEmail);

      // Assert
      expect(email.value).toBe('user@example123.com');
      expect(email.domain).toBe('example123.com');
    });
  });

  describe('error messages', () => {
    it('should provide meaningful error message for null email', () => {
      // Act & Assert
      expect(() => new Email(null as any)).toThrow('Email is required and must be a string');
    });

    it('should provide meaningful error message for invalid format', () => {
      // Act & Assert
      expect(() => new Email('invalid-email')).toThrow('Email must be a valid email address');
    });

    it('should provide meaningful error message for too long email', () => {
      // Arrange
      const longEmail = 'a'.repeat(255) + '@example.com';

      // Act & Assert
      expect(() => new Email(longEmail)).toThrow('Email must not exceed 254 characters');
    });
  });
}); 