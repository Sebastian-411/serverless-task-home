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

  constructor(id?: UUID) {
    this.id = id || BaseEntity.generateId();
    const timestamps = BaseEntity.createTimestamps();
    this.createdAt = timestamps.createdAt;
    this.updatedAt = timestamps.updatedAt;
  }

  static generateId(): UUID {
    return uuidv4();
  }

  static createTimestamps(): { createdAt: Timestamp; updatedAt: Timestamp } {
    const now = new Date().toISOString();
    return {
      createdAt: now,
      updatedAt: now
    };
  }

  updateTimestamp(): void {
    this.updatedAt = new Date().toISOString();
  }

  // Métodos de validación con tipos genéricos
  protected _validateUUID(value: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!value || !uuidRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid UUID`);
    }
  }

  protected _validateRequired<T>(value: T, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`);
    }
  }

  protected _validateLength(value: string, minLength: number, maxLength: number, fieldName: string): void {
    if (value && (value.length < minLength || value.length > maxLength)) {
      throw new ValidationError(`${fieldName} must be between ${minLength} and ${maxLength} characters`);
    }
  }

  protected _validateEnum<T extends string>(value: T, allowedValues: readonly T[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }
  }

  protected _validateTimestamp(value: string, fieldName: string): void {
    if (value && isNaN(Date.parse(value))) {
      throw new ValidationError(`${fieldName} must be a valid timestamp`);
    }
  }

  protected _validateEmail(value: string, fieldName: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }
  }

  protected _validateNumber(value: number, fieldName: string, min?: number, max?: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
    if (min !== undefined && value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }
    if (max !== undefined && value > max) {
      throw new ValidationError(`${fieldName} must be at most ${max}`);
    }
  }

  // Método abstracto para validación específica de entidades
  abstract validate(): void;

  // Método para convertir a objeto plano
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Método para clonar entidad
  clone<T extends BaseEntity>(this: T): T {
    const cloned = Object.create(Object.getPrototypeOf(this));
    Object.assign(cloned, this);
    return cloned;
  }

  // Método para comparar entidades
  equals(other: BaseEntity): boolean {
    return this.id === other.id;
  }
} 