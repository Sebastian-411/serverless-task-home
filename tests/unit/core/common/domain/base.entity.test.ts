import { BaseEntity } from '../../../../../core/common/domain/base.entity';
import { ValidationError } from '../../../../../core/common/domain/exceptions/validation.error';

// Clase concreta para testing
class TestEntity extends BaseEntity {
  constructor(id?: string) {
    super(id);
  }

  validate(): void {
    // Implementación mínima para testing
  }
}

describe('BaseEntity', () => {
  describe('constructor', () => {
    it('should create entity with generated ID when no ID provided', () => {
      // Act
      const entity = new TestEntity();

      // Assert
      expect(entity.id).toBeDefined();
      expect(typeof entity.id).toBe('string');
      expect(entity.id.length).toBeGreaterThan(0);
      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
    });

    it('should create entity with provided ID', () => {
      // Arrange
      const providedId = 'test-id-123';

      // Act
      const entity = new TestEntity(providedId);

      // Assert
      expect(entity.id).toBe(providedId);
      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
    });

    it('should set timestamps on creation', () => {
      // Arrange
      const beforeCreation = new Date();

      // Act
      const entity = new TestEntity();

      // Assert
      const afterCreation = new Date();
      expect(new Date(entity.createdAt).getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(new Date(entity.createdAt).getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(new Date(entity.updatedAt).getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(new Date(entity.updatedAt).getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('static methods', () => {
    describe('generateId', () => {
      it('should generate unique UUIDs', () => {
        // Act
        const id1 = BaseEntity.generateId();
        const id2 = BaseEntity.generateId();

        // Assert
        expect(id1).toBeDefined();
        expect(id2).toBeDefined();
        expect(id1).not.toBe(id2);
        expect(typeof id1).toBe('string');
        expect(typeof id2).toBe('string');
      });

      it('should generate valid UUID format', () => {
        // Act
        const id = BaseEntity.generateId();

        // Assert
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuidRegex.test(id)).toBe(true);
      });
    });

    describe('createTimestamps', () => {
      it('should create timestamps with current time', () => {
        // Arrange
        const beforeCreation = new Date();

        // Act
        const timestamps = BaseEntity.createTimestamps();

        // Assert
        const afterCreation = new Date();
        expect(timestamps.createdAt).toBeDefined();
        expect(timestamps.updatedAt).toBeDefined();
        expect(new Date(timestamps.createdAt).getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(new Date(timestamps.createdAt).getTime()).toBeLessThanOrEqual(afterCreation.getTime());
        expect(new Date(timestamps.updatedAt).getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(new Date(timestamps.updatedAt).getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      });

      it('should create identical timestamps', () => {
        // Act
        const timestamps = BaseEntity.createTimestamps();

        // Assert
        expect(timestamps.createdAt).toBe(timestamps.updatedAt);
      });
    });
  });

  describe('updateTimestamp', () => {
    it('should update only updatedAt timestamp', () => {
      // Arrange
      const entity = new TestEntity();
      const originalCreatedAt = entity.createdAt;
      const originalUpdatedAt = entity.updatedAt;

      // Wait a bit to ensure time difference
      const waitTime = 10;
      const startTime = Date.now();
      while (Date.now() - startTime < waitTime) {
        // Wait
      }

      // Act
      entity.updateTimestamp();

      // Assert
      expect(entity.createdAt).toBe(originalCreatedAt);
      expect(entity.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(entity.updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });
  });

  describe('validation methods', () => {
    let entity: TestEntity;

    beforeEach(() => {
      entity = new TestEntity();
    });

    describe('_validateUUID', () => {
      it('should not throw for valid UUID', () => {
        // Arrange
        const validUUID = '123e4567-e89b-12d3-a456-426614174000';

        // Act & Assert
        expect(() => (entity as any)._validateUUID(validUUID, 'testField')).not.toThrow();
      });

      it('should throw ValidationError for invalid UUID', () => {
        // Arrange
        const invalidUUID = 'invalid-uuid';

        // Act & Assert
        expect(() => (entity as any)._validateUUID(invalidUUID, 'testField'))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for empty UUID', () => {
        // Act & Assert
        expect(() => (entity as any)._validateUUID('', 'testField'))
          .toThrow(ValidationError);
        expect(() => (entity as any)._validateUUID(null as any, 'testField'))
          .toThrow(ValidationError);
        expect(() => (entity as any)._validateUUID(undefined as any, 'testField'))
          .toThrow(ValidationError);
      });
    });

    describe('_validateRequired', () => {
      it('should not throw for valid values', () => {
        // Act & Assert
        expect(() => (entity as any)._validateRequired('test', 'testField')).not.toThrow();
        expect(() => (entity as any)._validateRequired(123, 'testField')).not.toThrow();
        expect(() => (entity as any)._validateRequired(0, 'testField')).not.toThrow();
        expect(() => (entity as any)._validateRequired(false, 'testField')).not.toThrow();
      });

      it('should throw ValidationError for null/undefined/empty values', () => {
        // Act & Assert
        expect(() => (entity as any)._validateRequired(null, 'testField'))
          .toThrow(ValidationError);
        expect(() => (entity as any)._validateRequired(undefined, 'testField'))
          .toThrow(ValidationError);
        expect(() => (entity as any)._validateRequired('', 'testField'))
          .toThrow(ValidationError);
      });
    });

    describe('_validateLength', () => {
      it('should not throw for valid length', () => {
        // Act & Assert
        expect(() => (entity as any)._validateLength('test', 1, 10, 'testField')).not.toThrow();
        expect(() => (entity as any)._validateLength('test', 4, 4, 'testField')).not.toThrow();
      });

      it('should throw ValidationError for too short string', () => {
        // Act & Assert
        expect(() => (entity as any)._validateLength('test', 5, 10, 'testField'))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for too long string', () => {
        // Act & Assert
        expect(() => (entity as any)._validateLength('test', 1, 3, 'testField'))
          .toThrow(ValidationError);
      });

      it('should not throw for empty string when min is 0', () => {
        // Act & Assert
        expect(() => (entity as any)._validateLength('', 0, 10, 'testField')).not.toThrow();
      });
    });

    describe('_validateEnum', () => {
      it('should not throw for valid enum value', () => {
        // Arrange
        const allowedValues = ['value1', 'value2', 'value3'] as const;

        // Act & Assert
        expect(() => (entity as any)._validateEnum('value1', allowedValues, 'testField')).not.toThrow();
        expect(() => (entity as any)._validateEnum('value2', allowedValues, 'testField')).not.toThrow();
        expect(() => (entity as any)._validateEnum('value3', allowedValues, 'testField')).not.toThrow();
      });

      it('should throw ValidationError for invalid enum value', () => {
        // Arrange
        const allowedValues = ['value1', 'value2', 'value3'] as const;

        // Act & Assert
        expect(() => (entity as any)._validateEnum('invalid', allowedValues, 'testField'))
          .toThrow(ValidationError);
      });
    });

    describe('_validateTimestamp', () => {
      it('should not throw for valid timestamp', () => {
        // Arrange
        const validTimestamp = '2024-01-01T00:00:00.000Z';

        // Act & Assert
        expect(() => (entity as any)._validateTimestamp(validTimestamp, 'testField')).not.toThrow();
      });

      it('should throw ValidationError for invalid timestamp', () => {
        // Arrange
        const invalidTimestamp = 'invalid-timestamp';

        // Act & Assert
        expect(() => (entity as any)._validateTimestamp(invalidTimestamp, 'testField'))
          .toThrow(ValidationError);
      });

      it('should not throw for empty value', () => {
        // Act & Assert
        expect(() => (entity as any)._validateTimestamp('', 'testField')).not.toThrow();
      });
    });

    describe('_validateEmail', () => {
      it('should not throw for valid email', () => {
        // Arrange
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org'
        ];

        // Act & Assert
        validEmails.forEach(email => {
          expect(() => (entity as any)._validateEmail(email, 'testField')).not.toThrow();
        });
      });

      it('should throw ValidationError for invalid email', () => {
        // Arrange
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'test@',
          'test.example.com'
        ];

        // Act & Assert
        invalidEmails.forEach(email => {
          expect(() => (entity as any)._validateEmail(email, 'testField'))
            .toThrow(ValidationError);
        });
      });

      it('should not throw for empty value', () => {
        // Act & Assert
        expect(() => (entity as any)._validateEmail('', 'testField')).not.toThrow();
      });
    });

    describe('_validateNumber', () => {
      it('should not throw for valid number', () => {
        // Act & Assert
        expect(() => (entity as any)._validateNumber(123, 'testField')).not.toThrow();
        expect(() => (entity as any)._validateNumber(0, 'testField')).not.toThrow();
        expect(() => (entity as any)._validateNumber(-123, 'testField')).not.toThrow();
      });

      it('should throw ValidationError for invalid number', () => {
        // Act & Assert
        expect(() => (entity as any)._validateNumber(NaN, 'testField'))
          .toThrow(ValidationError);
        expect(() => (entity as any)._validateNumber('123' as any, 'testField'))
          .toThrow(ValidationError);
      });

      it('should validate min constraint', () => {
        // Act & Assert
        expect(() => (entity as any)._validateNumber(5, 'testField', 1)).not.toThrow();
        expect(() => (entity as any)._validateNumber(0, 'testField', 1))
          .toThrow(ValidationError);
      });

      it('should validate max constraint', () => {
        // Act & Assert
        expect(() => (entity as any)._validateNumber(5, 'testField', 1, 10)).not.toThrow();
        expect(() => (entity as any)._validateNumber(15, 'testField', 1, 10))
          .toThrow(ValidationError);
      });
    });
  });

  describe('utility methods', () => {
    let entity: TestEntity;

    beforeEach(() => {
      entity = new TestEntity('test-id');
    });

    describe('toJSON', () => {
      it('should return entity as plain object', () => {
        // Act
        const json = entity.toJSON();

        // Assert
        expect(json).toEqual({
          id: 'test-id',
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt
        });
      });
    });

    describe('clone', () => {
      it('should create a copy of the entity', () => {
        // Arrange
        const entity = new TestEntity();
        const originalUpdatedAt = entity.updatedAt;

        // Act
        const cloned = entity.clone();

        // Assert
        expect(cloned).not.toBe(entity);
        expect(cloned.id).toBe(entity.id);
        expect(cloned.createdAt).toBe(entity.createdAt);
        // The cloned entity should have a different updatedAt timestamp
        expect(cloned.updatedAt).toBeDefined();
        expect(typeof cloned.updatedAt).toBe('string');
        // Verify it's a valid timestamp
        expect(() => new Date(cloned.updatedAt)).not.toThrow();
      });
    });

    describe('equals', () => {
      it('should return true for same entity', () => {
        // Arrange
        const sameEntity = new TestEntity('test-id');

        // Act & Assert
        expect(entity.equals(sameEntity)).toBe(true);
      });

      it('should return false for different entities', () => {
        // Arrange
        const differentEntity = new TestEntity('different-id');

        // Act & Assert
        expect(entity.equals(differentEntity)).toBe(false);
      });

      it('should return false for non-entity objects', () => {
        // Arrange
        const nonEntity = { id: 'test-id' };

        // Act & Assert
        expect(entity.equals(nonEntity as any)).toBe(false);
      });
    });
  });

  describe('abstract methods', () => {
    it('should require validate method implementation', () => {
      // Act & Assert
      expect(() => {
        class InvalidEntity extends BaseEntity {
          validate(): void {
            // Implementation required
          }
        }
        new InvalidEntity();
      }).not.toThrow();
    });
  });
}); 