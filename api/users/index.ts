// GET /users (list), POST /users (create)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Dependencies } from '../../shared/config/dependencies';
import { HandlerContext } from '../../shared/middlewares/request-handler.middleware';
import { ValidationRule, ValidationMiddleware } from '../../shared/middlewares/validation.middleware';
import { ErrorHandler } from '../../shared/middlewares/error-handler.middleware';

// Ultra-fast validation rules - Compiled once, reused everywhere
const CREATE_USER_VALIDATION: ValidationRule[] = [
  { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'email', required: true, type: 'email', maxLength: 255 },
  { field: 'password', required: true, type: 'string', minLength: 6, maxLength: 100 },
  { field: 'phoneNumber', required: true, type: 'string', minLength: 10, maxLength: 20 },
  { 
    field: 'role', 
    required: false, 
    type: 'string',
    customValidator: (value: any) => !value || ['admin', 'user'].includes(value.toLowerCase().trim()),
    errorMessage: 'Role must be either "admin" or "user"'
  }
];

// High-performance endpoint factories - O(1) initialization
const handleGetUsers = Dependencies.createAuthenticatedEndpoint(['GET'], ['admin'])({}, 
  async (context: HandlerContext) => {
    const users = await Dependencies.getUsersUseCase.execute(context.authContext);
    return {
      data: users,
      message: 'Users retrieved successfully',
      meta: { count: users.length }
    };
  }
);

// Create a custom endpoint that handles both authenticated and public requests
const handleCreateUser = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const context: HandlerContext = {};

    // Step 1: Method validation
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST method is allowed'
      });
    }

    // Step 2: Body validation
    const bodyResult = ValidationMiddleware.validate(req.body, CREATE_USER_VALIDATION);
    if (!bodyResult.success) {
      return res.status(bodyResult.response!.status).json(bodyResult.response!.body);
    }
    context.validatedBody = bodyResult.data;

    // Step 3: Try authentication (optional)
    const authResult = await Dependencies.authMiddleware.authenticate(req, false);
    if (authResult.success && authResult.authContext) {
      context.authContext = authResult.authContext;
    } else {
      context.authContext = { isAuthenticated: false };
    }

    // Step 4: Execute use case - all business logic is handled there
    const user = await Dependencies.createUserUseCase.execute(
      context.validatedBody, 
      context.authContext
    );
    
    // Step 5: Success response
    return res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });

  } catch (error) {
    ErrorHandler.handle(error, res, 'POST /users');
  }
};

// Ultra-fast router - O(1) method dispatch
export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET': return handleGetUsers(req, res);
    case 'POST': return handleCreateUser(req, res);
    default: return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are allowed'
    });
  }
} 