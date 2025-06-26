const { v4: uuidv4 } = require('uuid');
const ValidationError = require('../validators/ValidationError');

/**
 * Base Model
 * Abstract base class for all domain models with common functionality
 */
class BaseModel {
  constructor() {
    if (this.constructor === BaseModel) {
      throw new Error('BaseModel is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Generates a new UUID
   * @returns {string} UUID
   */
  static generateId() {
    return uuidv4();
  }

  /**
   * Creates standardized timestamps
   * @returns {Object} Object with createdAt and updatedAt
   */
  static createTimestamps() {
    const now = new Date();
    return {
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Updates the updatedAt timestamp
   */
  updateTimestamp() {
    this.updatedAt = new Date();
  }

  // Validation helper methods
  _validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      throw ValidationError.required(fieldName);
    }
  }

  _validateUUID(value, fieldName) {
    this._validateRequired(value, fieldName);
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw ValidationError.invalidFormat(fieldName, 'valid UUID', value);
    }
  }

  _validateEmail(email, fieldName) {
    this._validateRequired(email, fieldName);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ValidationError.invalidFormat(fieldName, 'valid email address', email);
    }
  }

  _validatePhone(phone, fieldName) {
    this._validateRequired(phone, fieldName);
    
    // International phone format validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      throw ValidationError.invalidFormat(fieldName, 'valid phone number', phone);
    }
  }

  _validateEnum(value, allowedValues, fieldName) {
    this._validateRequired(value, fieldName);
    
    if (!allowedValues.includes(value)) {
      throw ValidationError.invalidEnum(fieldName, allowedValues, value);
    }
  }

  _validateTimestamp(timestamp, fieldName) {
    this._validateRequired(timestamp, fieldName);
    
    if (!(timestamp instanceof Date) && isNaN(Date.parse(timestamp))) {
      throw ValidationError.invalidFormat(fieldName, 'valid timestamp', timestamp);
    }
  }

  _validateLength(value, min, max, fieldName) {
    if (value && (value.length < min || value.length > max)) {
      throw ValidationError.invalidLength(fieldName, min, max, value.length);
    }
  }

  _validatePositiveNumber(value, fieldName) {
    if (typeof value !== 'number' || value <= 0) {
      throw ValidationError.invalidFormat(fieldName, 'positive number', value);
    }
  }

  _validateFutureDate(date, fieldName) {
    const now = new Date();
    const checkDate = new Date(date);
    
    if (checkDate <= now) {
      throw ValidationError.invalidFormat(fieldName, 'future date', date);
    }
  }

  /**
   * Abstract method that must be implemented by subclasses
   */
  validate() {
    throw new Error('validate() method must be implemented by subclass');
  }

  /**
   * Abstract method that must be implemented by subclasses
   */
  toJSON() {
    throw new Error('toJSON() method must be implemented by subclass');
  }
}

module.exports = BaseModel; 