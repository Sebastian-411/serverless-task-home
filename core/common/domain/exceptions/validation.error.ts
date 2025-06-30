/**
 * ValidationError
 * Custom error for validation failures
 */

export class ValidationError extends Error {
  public details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    
    // keep the appropriate stack trace
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