/**
 * Custom Validation Error Class
 * Provides detailed validation error information
 */

class ValidationError extends Error {
  constructor(field, message, value = null) {
    super(`Validation failed for field '${field}': ${message}`);
    this.name = 'ValidationError';
    this.field = field;
    this.message = message;
    this.value = value;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Creates a validation error for required fields
   * @param {string} field - Field name
   * @returns {ValidationError}
   */
  static required(field) {
    return new ValidationError(field, 'This field is required');
  }

  /**
   * Creates a validation error for invalid format
   * @param {string} field - Field name
   * @param {string} expectedFormat - Expected format description
   * @param {*} value - Invalid value
   * @returns {ValidationError}
   */
  static invalidFormat(field, expectedFormat, value) {
    return new ValidationError(field, `Invalid format. Expected: ${expectedFormat}`, value);
  }

  /**
   * Creates a validation error for invalid enum value
   * @param {string} field - Field name
   * @param {Array} validValues - Array of valid values
   * @param {*} value - Invalid value
   * @returns {ValidationError}
   */
  static invalidEnum(field, validValues, value) {
    return new ValidationError(
      field, 
      `Invalid value. Must be one of: ${validValues.join(', ')}`, 
      value
    );
  }

  /**
   * Converts error to JSON format
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      field: this.field,
      message: this.message,
      value: this.value,
      timestamp: this.timestamp
    };
  }
}

module.exports = ValidationError; 