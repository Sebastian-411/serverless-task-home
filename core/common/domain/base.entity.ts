import { v4 as uuidv4 } from 'uuid';

import { ValidationError } from './exceptions/validation.error';

// Tipos base para timestamps
export type Timestamp = string;
export type UUID = string;

// Interface para entidades con timestamps
export interface ITimestampedEntity {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interface para entidades con ID
export interface IEntity {
  id: UUID;
}

// Interface completa para entidades base
export interface IBaseEntity extends IEntity, ITimestampedEntity {}

// Tipo para validación de campos
export type ValidationRule<T> = {
  validate: (_value: T) => boolean;
  message: string;
};

// Tipo para configuración de validación
export type ValidationConfig<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export abstract class BaseEntity implements IBaseEntity {
  public readonly id: UUID;
  public createdAt: Timestamp;
  public updatedAt: Timestamp;

  /**
   * Constructs a new BaseEntity instance, generating a UUID and timestamps if not provided.
   *
   * @param {UUID} [id] - Optional UUID for the entity. If not provided, a new one is generated.
   */
  constructor(id?: UUID) {
    console.log('[BaseEntity][constructor] Creating new entity', { id });
    this.id = id || BaseEntity.generateId();
    const timestamps = BaseEntity.createTimestamps();
    this.createdAt = timestamps.createdAt;
    this.updatedAt = timestamps.updatedAt;
  }

  /**
   * Generates a new UUID v4 string.
   *
   * @returns {UUID} The generated UUID.
   */
  static generateId(): UUID {
    const uuid = uuidv4();
    console.log('[BaseEntity][generateId] Generated UUID', { uuid });
    return uuid;
  }

  /**
   * Creates current timestamps for createdAt and updatedAt.
   *
   * @returns {{ createdAt: Timestamp; updatedAt: Timestamp }} The timestamps object.
   */
  static createTimestamps(): { createdAt: Timestamp; updatedAt: Timestamp } {
    const now = new Date().toISOString();
    console.log('[BaseEntity][createTimestamps] Generated timestamps', { now });
    return {
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Updates the updatedAt timestamp to the current time.
   */
  updateTimestamp(): void {
    this.updatedAt = new Date().toISOString();
    console.log('[BaseEntity][updateTimestamp] updatedAt set', { updatedAt: this.updatedAt });
  }

  /**
   * Validates that a value is a valid UUID string.
   *
   * @param {string} value - The value to validate.
   * @param {string} fieldName - The name of the field being validated.
   * @throws {ValidationError} If the value is not a valid UUID.
   */
  protected _validateUUID(value: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!value || !uuidRegex.test(value)) {
      console.warn('[BaseEntity][_validateUUID] Validation failed', { fieldName, value });
      throw new ValidationError(`${fieldName} must be a valid UUID`);
    }
  }

  /**
   * Validates that a value is present (not null, undefined, or empty string).
   *
   * @param {T} value - The value to validate.
   * @param {string} fieldName - The name of the field being validated.
   * @throws {ValidationError} If the value is missing.
   */
  protected _validateRequired<T>(value: T, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      console.warn('[BaseEntity][_validateRequired] Validation failed', { fieldName, value });
      throw new ValidationError(`${fieldName} is required`);
    }
  }

  /**
   * Validates that a string's length is within the specified bounds.
   *
   * @param {string} value - The string to validate.
   * @param {number} minLength - Minimum allowed length.
   * @param {number} maxLength - Maximum allowed length.
   * @param {string} fieldName - The name of the field being validated.
   * @throws {ValidationError} If the string length is out of bounds.
   */
  protected _validateLength(value: string, minLength: number, maxLength: number, fieldName: string): void {
    if (value && (value.length < minLength || value.length > maxLength)) {
      console.warn('[BaseEntity][_validateLength] Validation failed', { fieldName, value, minLength, maxLength });
      throw new ValidationError(`${fieldName} must be between ${minLength} and ${maxLength} characters`);
    }
  }

  /**
   * Validates that a value is one of the allowed enum values.
   *
   * @param {T} value - The value to validate.
   * @param {readonly T[]} allowedValues - The allowed values.
   * @param {string} fieldName - The name of the field being validated.
   * @throws {ValidationError} If the value is not allowed.
   */
  protected _validateEnum<T extends string>(value: T, allowedValues: readonly T[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      console.warn('[BaseEntity][_validateEnum] Validation failed', { fieldName, value, allowedValues });
      throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }
  }

  /**
   * Validates that a value is a valid ISO timestamp string.
   *
   * @param {string} value - The value to validate.
   * @param {string} fieldName - The name of the field being validated.
   * @throws {ValidationError} If the value is not a valid timestamp.
   */
  protected _validateTimestamp(value: string, fieldName: string): void {
    if (value && isNaN(Date.parse(value))) {
      console.warn('[BaseEntity][_validateTimestamp] Validation failed', { fieldName, value });
      throw new ValidationError(`${fieldName} must be a valid timestamp`);
    }
  }

  /**
   * Validates that a value is a valid email address.
   *
   * @param {string} value - The value to validate.
   * @param {string} fieldName - The name of the field being validated.
   * @throws {ValidationError} If the value is not a valid email address.
   */
  protected _validateEmail(value: string, fieldName: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      console.warn('[BaseEntity][_validateEmail] Validation failed', { fieldName, value });
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }
  }

  /**
   * Validates that a value is a valid number and within optional bounds.
   *
   * @param {number} value - The value to validate.
   * @param {string} fieldName - The name of the field being validated.
   * @param {number} [min] - Optional minimum value.
   * @param {number} [max] - Optional maximum value.
   * @throws {ValidationError} If the value is not a valid number or out of bounds.
   */
  protected _validateNumber(value: number, fieldName: string, min?: number, max?: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn('[BaseEntity][_validateNumber] Validation failed: not a number', { fieldName, value });
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
    if (min !== undefined && value < min) {
      console.warn('[BaseEntity][_validateNumber] Validation failed: below min', { fieldName, value, min });
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }
    if (max !== undefined && value > max) {
      console.warn('[BaseEntity][_validateNumber] Validation failed: above max', { fieldName, value, max });
      throw new ValidationError(`${fieldName} must be at most ${max}`);
    }
  }

  /**
   * Abstract method for entity-specific validation. Must be implemented by subclasses.
   *
   * @throws {ValidationError} If the entity is invalid.
   */
  abstract validate(): void;

  /**
   * Converts the entity to a plain object.
   *
   * @returns {Record<string, unknown>} The plain object representation.
   */
  toJSON(): Record<string, unknown> {
    console.log('[BaseEntity][toJSON] Serializing entity', { id: this.id });
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Clones the entity, updating the updatedAt timestamp.
   *
   * @returns {T} The cloned entity instance.
   */
  clone<T extends BaseEntity>(this: T): T {
    const cloned = Object.create(Object.getPrototypeOf(this));
    Object.assign(cloned, {
      ...this,
      updatedAt: new Date().toISOString()
    });
    console.log('[BaseEntity][clone] Entity cloned', { id: this.id });
    return cloned;
  }

  /**
   * Compares this entity to another for equality by ID.
   *
   * @param {BaseEntity} other - The other entity to compare.
   * @returns {boolean} True if the entities have the same ID, false otherwise.
   */
  equals(other: BaseEntity): boolean {
    const isEqual = other instanceof BaseEntity && this.id === other.id;
    console.log('[BaseEntity][equals] Comparing entities', { thisId: this.id, otherId: other?.id, isEqual });
    return isEqual;
  }
} 