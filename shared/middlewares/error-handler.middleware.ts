import type { VercelRequest, VercelResponse } from '@vercel/node';

import { DomainError } from '../domain/exceptions/domain.error';
import { ValidationError } from '../domain/exceptions/validation.error';
import { EntityNotFoundError } from '../domain/exceptions/entity-not-found.error';
import { UnauthorizedError } from '../domain/exceptions/unauthorized.error';

export interface ErrorResponse {
  error: {
    name: string;
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
}

export function handleError(error: Error, request: VercelRequest, response: VercelResponse): void {
  let statusCode = 500;
  let errorResponse: ErrorResponse['error'];

  if (error instanceof DomainError) {
    statusCode = error.statusCode;
    errorResponse = {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    };
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    errorResponse = {
      name: 'ValidationError',
      message: error.message,
      code: 'VALIDATION_ERROR',
      statusCode: 400
    };
  } else if (error instanceof EntityNotFoundError) {
    statusCode = 404;
    errorResponse = {
      name: 'EntityNotFoundError',
      message: error.message,
      code: 'ENTITY_NOT_FOUND',
      statusCode: 404
    };
  } else if (error instanceof UnauthorizedError) {
    statusCode = 401;
    errorResponse = {
      name: 'UnauthorizedError',
      message: error.message,
      code: 'UNAUTHORIZED',
      statusCode: 401
    };
  } else {
    // Log unexpected errors for debugging
    // TODO: Replace with proper logging service
    errorResponse = {
      name: 'InternalServerError',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500
    };
  }

  response.status(statusCode).json({ error: errorResponse });
}

export function wrapHandler<T extends Record<string, unknown>>(
  handler: (request: VercelRequest, response: VercelResponse, context?: T) => Promise<void>
) {
  return async (request: VercelRequest, response: VercelResponse, context?: T): Promise<void> => {
    try {
      await handler(request, response, context);
    } catch (error) {
      handleError(error as Error, request, response);
    }
  };
} 