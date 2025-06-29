import { ValidationError } from '../exceptions/validation.error';

export class Name {
  private readonly _value: string;

  constructor(value: string) {
    this._validate(value);
    this._value = this._normalize(value);
  }

  private _validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Name is required and must be a string');
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      throw new ValidationError('Name must be at least 2 characters long');
    }

    if (trimmed.length > 100) {
      throw new ValidationError('Name must not exceed 100 characters');
    }

    // Validar que solo contenga letras, espacios, guiones y apóstrofes
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-']+$/;
    if (!nameRegex.test(trimmed)) {
      throw new ValidationError('Name can only contain letters, spaces, hyphens and apostrophes');
    }
  }

  private _normalize(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  get value(): string {
    return this._value;
  }

  get firstName(): string {
    return this._value.split(' ')[0];
  }

  get lastName(): string {
    const parts = this._value.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  get initials(): string {
    return this._value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  equals(other: Name): boolean {
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
      new Name(value);
      return true;
    } catch {
      return false;
    }
  }
} 