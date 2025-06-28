/**
 * ValidationError
 * Custom error for validation failures
 */

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    
    // Mantiene el stack trace adecuado
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Converts error to JSON format
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details
    };
  }
}

module.exports = ValidationError; 