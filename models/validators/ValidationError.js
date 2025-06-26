/**
 * Custom Validation Error
 * Specific error class for model validation failures
 */
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = Array.isArray(errors) ? errors : [errors];
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Creates a ValidationError for required field
   * @param {string} fieldName - Name of the required field
   * @returns {ValidationError}
   */
  static required(fieldName) {
    return new ValidationError(
      `Validation failed: ${fieldName} is required`,
      [`${fieldName} is required`]
    );
  }

  /**
   * Creates a ValidationError for invalid format
   * @param {string} fieldName - Name of the field
   * @param {string} expectedFormat - Expected format description
   * @param {*} actualValue - The actual invalid value
   * @returns {ValidationError}
   */
  static invalidFormat(fieldName, expectedFormat, actualValue) {
    return new ValidationError(
      `Validation failed: ${fieldName} has invalid format`,
      [`${fieldName} must be ${expectedFormat}, received: ${actualValue}`]
    );
  }

  /**
   * Creates a ValidationError for invalid enum value
   * @param {string} fieldName - Name of the field
   * @param {Array} allowedValues - Array of allowed values
   * @param {*} actualValue - The actual invalid value
   * @returns {ValidationError}
   */
  static invalidEnum(fieldName, allowedValues, actualValue) {
    return new ValidationError(
      `Validation failed: ${fieldName} has invalid value`,
      [`${fieldName} must be one of: ${allowedValues.join(', ')}, received: ${actualValue}`]
    );
  }

  /**
   * Creates a ValidationError for invalid length
   * @param {string} fieldName - Name of the field
   * @param {number} min - Minimum length
   * @param {number} max - Maximum length
   * @param {number} actual - Actual length
   * @returns {ValidationError}
   */
  static invalidLength(fieldName, min, max, actual) {
    return new ValidationError(
      `Validation failed: ${fieldName} has invalid length`,
      [`${fieldName} must be between ${min} and ${max} characters, received: ${actual}`]
    );
  }

  /**
   * Returns formatted error messages
   * @returns {Array<string>}
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Returns formatted error message for API responses
   * @returns {Object}
   */
  toJSON() {
    return {
      error: 'ValidationError',
      message: this.message,
      details: this.errors
    };
  }
}

module.exports = ValidationError; 