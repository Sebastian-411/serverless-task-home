import { ValidationError } from '../exceptions/validation.error';

export class Email {
  private readonly _value: string;

  /**
   * Constructs a new Email value object, validating and normalizing the input.
   *
   * @param {string} value - The email address string.
   * @throws {ValidationError} If the value is missing or invalid.
   */
  constructor(value: string) {
    console.log('[Email][constructor] Creating Email value object', { value });
    if (!value || typeof value !== 'string') {
      console.warn('[Email][constructor] Validation failed: Email is required and must be a string', { value });
      throw new ValidationError('Email is required and must be a string');
    }
    
    const trimmedValue = value.trim();
    this._validate(trimmedValue);
    this._value = trimmedValue.toLowerCase();
  }

  /**
   * Validates the email address format and length.
   *
   * @param {string} value - The email address to validate.
   * @throws {ValidationError} If the email is invalid.
   */
  private _validate(value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      console.warn('[Email][_validate] Validation failed: Invalid email format', { value });
      throw new ValidationError('Email must be a valid email address');
    }

    if (value.length > 254) {
      console.warn('[Email][_validate] Validation failed: Email exceeds max length', { value });
      throw new ValidationError('Email must not exceed 254 characters');
    }
  }

  /**
   * Gets the normalized email value.
   *
   * @returns {string} The normalized email address.
   */
  get value(): string {
    console.log('[Email][value] Getting email value', { value: this._value });
    return this._value;
  }

  /**
   * Gets the domain part of the email address.
   *
   * @returns {string} The domain part.
   */
  get domain(): string {
    return this._value.split('@')[1];
  }

  /**
   * Gets the username part of the email address.
   *
   * @returns {string} The username part.
   */
  get username(): string {
    return this._value.split('@')[0];
  }

  /**
   * Compares this Email value object to another for equality.
   *
   * @param {Email} other - The other Email value object.
   * @returns {boolean} True if the emails are equal, false otherwise.
   */
  equals(other: Email): boolean {
    const isEqual = !!other && this._value === other._value;
    console.log('[Email][equals] Comparing emails', { thisValue: this._value, otherValue: other?._value, isEqual });
    return isEqual;
  }

  /**
   * Returns the string representation of the email address.
   *
   * @returns {string} The email address.
   */
  toString(): string {
    return this._value;
  }

  /**
   * Returns the JSON representation of the email address.
   *
   * @returns {string} The email address.
   */
  toJSON(): string {
    return this._value;
  }

  /**
   * Checks if a string is a valid email address.
   *
   * @param {string} value - The email address to validate.
   * @returns {boolean} True if valid, false otherwise.
   */
  static isValid(value: string): boolean {
    try {
      new Email(value);
      return true;
    } catch (error) {
      console.warn('[Email][isValid] Validation failed', { value, error });
      return false;
    }
  }
} 