/**
 * Base Model Class
 * Provides common functionality for all data models
 */

const { v4: uuidv4 } = require('uuid');
const ValidationError = require('./ValidationError');
const { VALIDATION_PATTERNS } = require('./constants');

class BaseModel {
  constructor() {
    this._errors = [];
  }

  /**
   * Generates a new UUID
   * @returns {string}
   */
  static generateId() {
    return uuidv4();
  }

  /**
   * Validates if a string is required and not empty
   * @param {string} value - Value to validate
   * @param {string} fieldName - Field name for error reporting
   * @throws {ValidationError}
   */
  _validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw ValidationError.required(fieldName);
    }
  }

  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @param {string} fieldName - Field name for error reporting
   * @throws {ValidationError}
   */
  _validateEmail(email, fieldName = 'email') {
    this._validateRequired(email, fieldName);
    if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
      throw ValidationError.invalidFormat(fieldName, 'valid email address', email);
    }
  }

  /**
   * Validates phone number format
   * @param {string} phone - Phone number to validate
   * @param {string} fieldName - Field name for error reporting
   * @throws {ValidationError}
   */
  _validatePhone(phone, fieldName = 'phoneNumber') {
    this._validateRequired(phone, fieldName);
    if (!VALIDATION_PATTERNS.PHONE.test(phone)) {
      throw ValidationError.invalidFormat(fieldName, 'valid phone number', phone);
    }
  }

  /**
   * Validates UUID format
   * @param {string} uuid - UUID to validate
   * @param {string} fieldName - Field name for error reporting
   * @throws {ValidationError}
   */
  _validateUUID(uuid, fieldName = 'id') {
    this._validateRequired(uuid, fieldName);
    if (!VALIDATION_PATTERNS.UUID.test(uuid)) {
      throw ValidationError.invalidFormat(fieldName, 'valid UUID', uuid);
    }
  }

  /**
   * Validates enum value
   * @param {*} value - Value to validate
   * @param {Array} validValues - Array of valid values
   * @param {string} fieldName - Field name for error reporting
   * @throws {ValidationError}
   */
  _validateEnum(value, validValues, fieldName) {
    this._validateRequired(value, fieldName);
    if (!validValues.includes(value)) {
      throw ValidationError.invalidEnum(fieldName, validValues, value);
    }
  }

  /**
   * Validates timestamp
   * @param {*} timestamp - Timestamp to validate
   * @param {string} fieldName - Field name for error reporting
   * @throws {ValidationError}
   */
  _validateTimestamp(timestamp, fieldName) {
    if (!timestamp) {
      throw ValidationError.required(fieldName);
    }
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw ValidationError.invalidFormat(fieldName, 'valid timestamp', timestamp);
    }
  }

  /**
   * Creates timestamps for new entities
   * @returns {Object}
   */
  static createTimestamps() {
    const now = new Date().toISOString();
    return {
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Updates the updatedAt timestamp
   * @returns {string}
   */
  updateTimestamp() {
    this.updatedAt = new Date().toISOString();
    return this.updatedAt;
  }

  /**
   * Converts model to plain object (to be implemented by subclasses)
   * @abstract
   * @returns {Object}
   */
  toObject() {
    throw new Error('toObject method must be implemented by subclasses');
  }

  /**
   * Converts model to JSON string
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }
}

module.exports = BaseModel; 