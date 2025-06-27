import { VercelRequest, VercelResponse } from '@vercel/node';
import { SupabaseService } from '../auth/supabase.service';
import { UserRepositoryPrisma } from '../../core/user/infrastructure/user.repository.prisma';
import { AuthContext } from '../../core/user/application/get-user-by-id.usecase';

export interface AuthResult {
  success: boolean;
  authContext?: AuthContext;
  response?: {
    status: number;
    body: any;
  };
}

export class AuthMiddleware {
  constructor(private userRepository: UserRepositoryPrisma) {}

  /**
   * Fast authentication middleware - O(1) token validation
   * Single Responsibility: Handle authentication only
   */
  async authenticate(req: VercelRequest, required: boolean = true): Promise<AuthResult> {
    const token = SupabaseService.extractTokenFromRequest(req);
    
    if (!token) {
      if (required) {
        return {
          success: false,
          response: {
            status: 401,
            body: {
              error: 'Authorization error',
              message: 'Authorization header with Bearer token is required'
            }
          }
        };
      }
      return { success: true, authContext: { isAuthenticated: false } };
    }

    try {
      const supabaseUser = await SupabaseService.validateToken(token, this.userRepository);
      
      if (!supabaseUser) {
        return {
          success: false,
          response: {
            status: 401,
            body: {
              error: 'Authorization error',
              message: 'Invalid or expired token'
            }
          }
        };
      }

      return {
        success: true,
        authContext: {
          isAuthenticated: true,
          user: {
            id: supabaseUser.id,
            email: supabaseUser.email,
            role: supabaseUser.role
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        response: {
          status: 500,
          body: {
            error: 'Internal server error',
            message: 'Authentication service error'
          }
        }
      };
    }
  }

  /**
   * Role-based authorization - O(1) role check
   * Open/Closed Principle: Extensible for new roles
   */
  authorizeRole(authContext: AuthContext, allowedRoles: string[]): AuthResult {
    if (!authContext.isAuthenticated || !authContext.user) {
      return {
        success: false,
        response: {
          status: 403,
          body: {
            error: 'Authorization error',
            message: 'Authentication required'
          }
        }
      };
    }

    if (!allowedRoles.includes(authContext.user.role)) {
      // Check if it's admin-only access  
      const isAdminOnlyEndpoint = allowedRoles.length === 1 && allowedRoles[0] === 'admin';
      const message = isAdminOnlyEndpoint ? 'Only administrators can access' : 'Authorization error';
      
      return {
        success: false,
        response: {
          status: 403,
          body: {
            error: 'Authorization error',
            message
          }
        }
      };
    }

    return { success: true };
  }
} 