import { VercelResponse } from '@vercel/node';

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}

export class ErrorHandler {
  /**
   * Ultra-fast error mapping - O(1) hash lookup
   * Open/Closed Principle: Easy to extend with new error types
   */
  private static readonly ERROR_MAP = new Map<string, { status: number; error: string; preserveMessage?: boolean }>([
    // Authorization errors - preserve original messages for test compatibility
    ['Only administrators can access', { status: 403, error: 'Only administrators can access', preserveMessage: true }],
    ['Users can only access their own profile', { status: 403, error: 'Authorization error' }],
    ['Authentication required', { status: 403, error: 'Authorization error' }],
    ['Regular users cannot create', { status: 403, error: 'Authorization error' }],
    ['Anonymous users can only register', { status: 403, error: 'Authorization error' }],
    ['Unauthorized to create user', { status: 403, error: 'Authorization error' }],
    ['Only administrators can change', { status: 403, error: 'Authorization error' }],
    ['Insufficient permissions', { status: 403, error: 'Insufficient permissions' }],
    
    // Not found errors
    ['User not found', { status: 404, error: 'Not found' }],
    ['not found', { status: 404, error: 'Not found' }],
    
    // Conflict errors - preserve exact message for test compatibility
    ['User with this email already exists', { status: 409, error: 'already exists', preserveMessage: true }],
    ['User already registered', { status: 409, error: 'already exists' }],
    ['already registered', { status: 409, error: 'already exists' }],
    ['already exists', { status: 409, error: 'already exists' }],
    
    // Validation errors
    ['validation', { status: 400, error: 'Validation error' }],
    ['Invalid role', { status: 400, error: 'Validation error' }],
    ['Role must be', { status: 400, error: 'Validation error' }],
    
    // Service errors
    ['Supabase', { status: 400, error: 'Authentication service error' }],
    ['database', { status: 500, error: 'Database error' }],
    ['prisma', { status: 500, error: 'Database error' }]
  ]);

  /**
   * Optimized error handling - O(m) where m = number of error patterns (typically 1-3)
   * Single Responsibility: Handle errors consistently
   */
  static handle(error: unknown, res: VercelResponse, context: string = ''): void {
    console.error(`Error in ${context}:`, error);

    if (!(error instanceof Error)) {
      this.sendError(res, 500, 'Internal server error', 'Unknown error occurred');
      return;
    }

    // Fast error pattern matching
    for (const [pattern, config] of this.ERROR_MAP) {
      if (error.message.includes(pattern)) {
        const message = config.preserveMessage ? error.message : config.error;
        this.sendError(res, config.status, config.error, message);
        return;
      }
    }

    // Default error
    this.sendError(res, 500, 'Internal server error', 'An unexpected error occurred');
  }

  /**
   * Optimized success response - O(1)
   */
  static success(res: VercelResponse, data: any, message: string = 'Operation successful', meta?: any, statusCode: number = 200): void {
    const response: any = {
      success: true,
      message,
      data
    };

    if (meta) {
      Object.assign(response, meta);
    }

    res.status(statusCode).json(response);
  }

  /**
   * Fast error response - O(1)
   */
  private static sendError(res: VercelResponse, status: number, error: string, message: string): void {
    res.status(status).json({ error, message });
  }

  /**
   * Specialized handlers for common patterns - O(1)
   */
  static handleAuthError(res: VercelResponse, message: string = 'Authentication required'): void {
    this.sendError(res, 401, 'Authorization error', message);
  }

  static handleForbiddenError(res: VercelResponse, message: string = 'Insufficient permissions'): void {
    this.sendError(res, 403, 'Authorization error', message);
  }

  static handleNotFoundError(res: VercelResponse, message: string = 'Resource not found'): void {
    this.sendError(res, 404, 'Not found', message);
  }

  static handleValidationError(res: VercelResponse, message: string = 'Validation failed'): void {
    this.sendError(res, 400, 'Validation error', message);
  }
} 