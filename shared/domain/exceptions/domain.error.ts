/**
 * DomainError
 * Base class for all domain-specific errors
 */

export abstract class DomainError extends Error {
  public readonly name: string;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Mantiene el stack trace adecuado
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts error to JSON format
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    };
  }

  /**
   * Creates a standardized error response
   */
  toResponse() {
    return {
      error: {
        type: this.name,
        code: this.code,
        message: this.message,
        details: this.details
      }
    };
  }
} 