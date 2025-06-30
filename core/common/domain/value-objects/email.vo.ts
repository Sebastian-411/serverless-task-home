import { ValidationError } from '../exceptions/validation.error';

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Email is required and must be a string');
    }
    
    const trimmedValue = value.trim();
    this._validate(trimmedValue);
    this._value = trimmedValue.toLowerCase();
  }

  private _validate(value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError('Email must be a valid email address');
    }

    if (value.length > 254) {
      throw new ValidationError('Email must not exceed 254 characters');
    }
  }

  get value(): string {
    return this._value;
  }

  get domain(): string {
    return this._value.split('@')[1];
  }

  get username(): string {
    return this._value.split('@')[0];
  }

  equals(other: Email): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }

  static isValid(value: string): boolean {
    try {
      new Email(value);
      return true;
    } catch {
      return false;
    }
  }
} 