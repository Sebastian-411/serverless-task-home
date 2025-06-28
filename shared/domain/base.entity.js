/**
 * Base Entity
 * Common functionality for all domain entities
 */

const { v4: uuidv4 } = require('uuid');

class BaseEntity {
  constructor() {
    // Constructor vacío por defecto
  }

  /**
   * Generates a UUID
   */
  static generateId() {
    return uuidv4();
  }

  /**
   * Creates timestamps for new entities
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
   */
  updateTimestamp() {
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Validates a UUID format
   */
  _validateUUID(value, fieldName) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!value || !uuidRegex.test(value)) {
      throw new Error(`${fieldName} must be a valid UUID`);
    }
  }

  /**
   * Validates required fields
   */
  _validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} is required`);
    }
  }

  /**
   * Validates string length
   */
  _validateLength(value, minLength, maxLength, fieldName) {
    if (value && (value.length < minLength || value.length > maxLength)) {
      throw new Error(`${fieldName} must be between ${minLength} and ${maxLength} characters`);
    }
  }

  /**
   * Validates enum values
   */
  _validateEnum(value, allowedValues, fieldName) {
    if (!allowedValues.includes(value)) {
      throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }
  }

  /**
   * Validates timestamp
   */
  _validateTimestamp(value, fieldName) {
    if (value && isNaN(Date.parse(value))) {
      throw new Error(`${fieldName} must be a valid timestamp`);
    }
  }
}

module.exports = BaseEntity; 