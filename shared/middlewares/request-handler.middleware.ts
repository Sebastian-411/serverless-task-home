import type { VercelRequest, VercelResponse } from '@vercel/node';

import { authenticate, authorize, type AuthContext } from './auth.middleware';
import { handleError } from './error-handler.middleware';

export interface RequestContext {
  auth?: AuthContext;
  requestId: string;
  timestamp: number;
}

export interface RequestHandler<T = unknown> {
  (request: VercelRequest, response: VercelResponse, context: RequestContext): Promise<T>;
}

export function createAuthenticatedEndpoint<T>(
  handler: RequestHandler<T>,
  resource: string,
  action: string
) {
  return async (request: VercelRequest, response: VercelResponse): Promise<void> => {
    try {
      const context: RequestContext = {
        requestId: generateRequestId(),
        timestamp: Date.now()
      };

      // Authenticate and authorize
      const authContext = await authenticate(request);
      const isAuthorized = await authorize(authContext, resource, action);
      
      if (!isAuthorized) {
        response.status(403).json({ 
          error: 'Forbidden',
          message: `Unauthorized to perform '${action}' on '${resource}'`
        });
        return;
      }

      context.auth = authContext;

      // Execute handler
      const result = await handler(request, response, context);
      
      // Send response
      if (result !== undefined) {
        response.status(200).json(result);
      }
    } catch (error) {
      handleError(error as Error, request, response);
    }
  };
}

export function createPublicEndpoint<T>(
  handler: RequestHandler<T>
) {
  return async (request: VercelRequest, response: VercelResponse): Promise<void> => {
    try {
      const context: RequestContext = {
        requestId: generateRequestId(),
        timestamp: Date.now()
      };

      // Execute handler
      const result = await handler(request, response, context);
      
      // Send response
      if (result !== undefined) {
        response.status(200).json(result);
      }
    } catch (error) {
      handleError(error as Error, request, response);
    }
  };
}

export function createValidatedEndpoint<T>(
  handler: RequestHandler<T>,
  validator?: (request: VercelRequest) => Promise<boolean>
) {
  return async (request: VercelRequest, response: VercelResponse): Promise<void> => {
    try {
      const context: RequestContext = {
        requestId: generateRequestId(),
        timestamp: Date.now()
      };

      // Validate request if validator provided
      if (validator) {
        const isValid = await validator(request);
        if (!isValid) {
          response.status(400).json({ 
            error: 'ValidationError',
            message: 'Request validation failed'
          });
          return;
        }
      }

      // Execute handler
      const result = await handler(request, response, context);
      
      // Send response
      if (result !== undefined) {
        response.status(200).json(result);
      }
    } catch (error) {
      handleError(error as Error, request, response);
    }
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
} 