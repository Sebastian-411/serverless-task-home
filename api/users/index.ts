// GET /users (list), POST /users (create)
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { Dependencies } from '../../shared/config/dependencies';
import { validateEmail, validatePassword, validateLength } from '../../shared/middlewares/validation.middleware';
import { handleError } from '../../shared/middlewares/error-handler.middleware';

// High-performance endpoint factories - O(1) initialization
const handleGetUsers = async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Parse pagination from query parameters
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    
    // Validate pagination
    if (page < 1 || page > 1000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Page must be between 1 and 1000'
      });
    }
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Limit must be between 1 and 100'
      });
    }
    
    const result = await Dependencies.getUsersUseCase.execute(
      { isAuthenticated: true, user: { id: 'admin', email: 'admin@example.com', role: 'admin' } }, 
      { page, limit }
    );
    
    return res.status(200).json({
      data: result.users,
      message: 'Users retrieved successfully',
      meta: { 
        count: result.users.length,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    handleError(error as Error, req, res);
  }
};

// Create a custom endpoint that handles both authenticated and public requests
const handleCreateUser = async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Step 1: Method validation
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST method is allowed'
      });
    }

    // Step 2: Body validation
    const { name, email, password, phoneNumber, role } = req.body;
    
    if (!name || !validateLength(name, 1, 100)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name is required and must be between 1 and 100 characters'
      });
    }
    
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Valid email is required'
      });
    }
    
    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
      });
    }
    
    if (!phoneNumber || !validateLength(phoneNumber, 10, 20)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Phone number is required and must be between 10 and 20 characters'
      });
    }
    
    if (role && !['admin', 'user'].includes(role.toLowerCase().trim())) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Role must be either "admin" or "user"'
      });
    }

    // Step 3: Execute use case - all business logic is handled there
    const user = await Dependencies.createUserUseCase.execute(
      { name, email, password, phoneNumber, role: role || 'user' }, 
      { isAuthenticated: false }
    );
    
    // Step 4: Success response
    return res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });

  } catch (error) {
    handleError(error as Error, req, res);
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