import type { VercelRequest, VercelResponse } from '@vercel/node';

import { UnauthorizedError } from '../../domain/exceptions/unauthorized.error';
import type { UserId } from '../../domain/value-objects/types';

export interface AuthContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
}

export interface AuthMiddleware {
  authenticate: (req: VercelRequest, res: VercelResponse) => Promise<AuthContext>;
  authorize: (req: VercelRequest, res: VercelResponse, requiredRole?: string) => Promise<AuthContext>;
}

// Extract JWT token from Authorization header
function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Verify JWT token and extract user info
async function verifyToken(token: string): Promise<AuthContext> {
  try {
    // TODO: Implement real JWT verification
    // For now, return mock data for testing
    const mockUser = {
      id: 'user-123',
      email: 'admin@example.com',
      role: 'admin' as const
    };
    
    return {
      isAuthenticated: true,
      user: mockUser
    };
  } catch (error) {
    console.log('Token verification failed:', error);
    return {
      isAuthenticated: false
    };
  }
}

// Main authentication function
export async function authenticate(req: VercelRequest, res: VercelResponse): Promise<AuthContext> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return {
        isAuthenticated: false
      };
    }
    
    const authContext = await verifyToken(token);
    return authContext;
  } catch (error) {
    console.log('Authentication failed:', error);
    return {
      isAuthenticated: false
    };
  }
}

// Authorize request with role check
export async function authorize(req: VercelRequest, res: VercelResponse, requiredRole?: string): Promise<AuthContext> {
  const authContext = await authenticate(req, res);
  
  if (!authContext.isAuthenticated) {
    throw new UnauthorizedError('Authentication required');
  }
  
  if (requiredRole && authContext.user?.role !== requiredRole) {
    throw new UnauthorizedError(`Access denied. Required role: ${requiredRole}`);
  }
  
  return authContext;
}

// Helper function to create authenticated endpoint
export function createAuthenticatedEndpoint(methods: string[] = ['GET'], allowedRoles?: string[]) {
  return function(pathValidation?: any, handler?: any) {
    return async (req: VercelRequest, res: VercelResponse) => {
      try {
        // Method validation
        if (!methods.includes(req.method)) {
          return res.status(405).json({
            error: 'Method not allowed',
            message: `Only ${methods.join(', ')} methods are allowed`
          });
        }
        
        // Authentication
        const authContext = await authenticate(req, res);
        
        // Authorization
        if (allowedRoles && allowedRoles.length > 0) {
          if (!authContext.isAuthenticated || !authContext.user) {
            return res.status(401).json({
              error: 'Unauthorized',
              message: 'Authentication required'
            });
          }
          
          if (!allowedRoles.includes(authContext.user.role)) {
            return res.status(403).json({
              error: 'Forbidden',
              message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
          }
        }
        
        // Execute handler if provided
        if (handler) {
          const context = {
            authContext,
            pathParam: req.query.id,
            validatedBody: req.body
          };
          const result = await handler(context);
          return res.status(200).json(result);
        }
        
        return res.status(200).json({ success: true });
      } catch (error) {
        throw error;
      }
    };
  };
} 