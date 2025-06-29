import type { VercelRequest } from '@vercel/node';

import { UnauthorizedError } from '../domain/exceptions/unauthorized.error';
import type { UserId } from '../domain/value-objects/types';

export interface AuthContext {
  userId: UserId;
  email: string;
  role: string;
  isAuthenticated: boolean;
}

export async function authenticate(request: VercelRequest): Promise<AuthContext> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  // Extract token but don't use it yet (TODO: implement real validation)
  const _token = authHeader.substring(7);
  
  try {
    // TODO: Implement real token validation
    // For now, return a mock authenticated context
    return {
      userId: 'mock-user-id' as UserId,
      email: 'mock@example.com',
      role: 'user',
      isAuthenticated: true
    };
  } catch {
    throw new UnauthorizedError('Invalid token');
  }
}

export async function authorize(context: AuthContext, _resource: string, _action: string): Promise<boolean> {
  if (!context.isAuthenticated) {
    return false;
  }

  // TODO: Implement real authorization logic
  // For now, allow all authenticated users
  return true;
}

export function requireAuth(resource: string, action: string) {
  return async (request: VercelRequest): Promise<AuthContext> => {
    const context = await authenticate(request);
    const isAuthorized = await authorize(context, resource, action);
    
    if (!isAuthorized) {
      throw new UnauthorizedError(`Unauthorized to perform '${action}' on '${resource}'`);
    }
    
    return context;
  };
} 