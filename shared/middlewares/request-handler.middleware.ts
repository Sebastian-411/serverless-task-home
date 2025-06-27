import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthMiddleware, AuthResult } from './auth.middleware';
import { ValidationMiddleware, ValidationResult } from './validation.middleware';
import { ErrorHandler } from './error-handler.middleware';

export interface RequestConfig {
  methods: string[];
  authRequired?: boolean;
  allowedRoles?: string[];
  pathParam?: {
    name: string;
    type: 'uuid' | 'string';
  };
  bodyValidation?: any[];
}

export interface HandlerContext {
  authContext?: any;
  pathParam?: string;
  validatedBody?: any;
}

export type RequestHandler = (context: HandlerContext) => Promise<any>;

/**
 * High-performance request processor following SOLID and Hexagonal Architecture
 * - Single Responsibility: Process requests through middleware chain
 * - Open/Closed: Easily extensible with new middleware
 * - Liskov Substitution: Handlers are interchangeable
 * - Interface Segregation: Small, focused interfaces
 * - Dependency Inversion: Depends on abstractions, not concretions
 */
export class RequestProcessor {
  constructor(private authMiddleware: AuthMiddleware) {}

  /**
   * Ultra-fast request processing pipeline - O(k) where k = number of middleware
   * Follows hexagonal architecture by separating concerns
   */
  async process(
    req: VercelRequest,
    res: VercelResponse,
    config: RequestConfig,
    handler: RequestHandler
  ): Promise<VercelResponse | void> {
    try {
      const context: HandlerContext = {};

      // Step 1: Method validation - O(1)
      const methodResult = ValidationMiddleware.validateMethod(req, config.methods);
      if (!methodResult.success) {
        return res.status(methodResult.response!.status).json(methodResult.response!.body);
      }

      // Step 2: Path parameter validation - O(1)
      if (config.pathParam) {
        const paramResult = ValidationMiddleware.validatePathParam(req, config.pathParam.name, config.pathParam.type);
        if (!paramResult.success) {
          return res.status(paramResult.response!.status).json(paramResult.response!.body);
        }
        context.pathParam = paramResult.data;
      }

      // Step 3: Authentication - O(1) with caching
      if (config.authRequired !== false) {
        const authResult = await this.authMiddleware.authenticate(req, config.authRequired);
        if (!authResult.success) {
          return res.status(authResult.response!.status).json(authResult.response!.body);
        }
        context.authContext = authResult.authContext;

        // Step 4: Authorization - O(1)
        if (config.allowedRoles) {
          const roleResult = this.authMiddleware.authorizeRole(context.authContext!, config.allowedRoles);
          if (!roleResult.success) {
            return res.status(roleResult.response!.status).json(roleResult.response!.body);
          }
        }
      }

      // Step 5: Body validation - O(n) where n = validation rules
      if (config.bodyValidation && req.method !== 'GET') {
        const bodyResult = ValidationMiddleware.validate(req.body, config.bodyValidation);
        if (!bodyResult.success) {
          return res.status(bodyResult.response!.status).json(bodyResult.response!.body);
        }
        context.validatedBody = bodyResult.data;
      }

      // Step 6: Execute business logic - O(varies by use case)
      const result = await handler(context);
      
      // Step 7: Success response - O(1)
      // Login endpoints should return 200, not 201
      const isCreationEndpoint = req.method === 'POST' && !req.url?.includes('/auth/login');
      const statusCode = isCreationEndpoint ? 201 : 200;
      ErrorHandler.success(res, result.data, result.message, result.meta, statusCode);

    } catch (error) {
      // Step 8: Error handling - O(1)
      ErrorHandler.handle(error, res, req.url || 'unknown');
    }
  }

  /**
   * Fast factory method for common patterns - O(1)
   */
  static createAuthenticatedEndpoint(
    authMiddleware: AuthMiddleware,
    methods: string[] = ['GET'],
    allowedRoles?: string[]
  ) {
    const processor = new RequestProcessor(authMiddleware);
    return (config: Partial<RequestConfig>, handler: RequestHandler) => {
      return (req: VercelRequest, res: VercelResponse) => processor.process(
        req,
        res,
        { methods, authRequired: true, allowedRoles, ...config },
        handler
      );
    };
  }

  /**
   * Fast factory method for public endpoints - O(1)
   */
  static createPublicEndpoint(authMiddleware: AuthMiddleware, methods: string[] = ['POST']) {
    const processor = new RequestProcessor(authMiddleware);
    return (config: Partial<RequestConfig>, handler: RequestHandler) => {
      return (req: VercelRequest, res: VercelResponse) => processor.process(
        req,
        res,
        { methods, authRequired: false, ...config },
        handler
      );
    };
  }
} 