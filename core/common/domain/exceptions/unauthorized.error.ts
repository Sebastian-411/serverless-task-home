import { DomainError } from './domain.error';

/**
 * UnauthorizedError
 * Thrown when a user is not authorized to perform an action
 */

export class UnauthorizedError extends DomainError {
  constructor(
    message: string = 'Unauthorized access',
    details?: Record<string, unknown>
  ) {
    super(
      message,
      'UNAUTHORIZED',
      401,
      details
    );
  }

  static forAction(action: string, resource: string): UnauthorizedError {
    return new UnauthorizedError(`Unauthorized to perform '${action}' on '${resource}'`);
  }

  static forResource(resource: string): UnauthorizedError {
    return new UnauthorizedError(`Unauthorized access to '${resource}'`);
  }

  static forUserAction(userId: string, action: string, resource: string): UnauthorizedError {
    return new UnauthorizedError(`Unauthorized to perform '${action}' on '${resource}' for user ${userId}`);
  }
} 