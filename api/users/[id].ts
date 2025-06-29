// GET /users/:id
import type { VercelRequest, VercelResponse } from '@vercel/node';

  import { Dependencies } from '../../shared/config/dependencies';
  import { handleError } from '../../shared/middlewares/error-handler.middleware';

// Simple handler for getting user by ID
const handleGetUserById = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Valid user ID is required'
      });
    }

    // TODO: Implement authentication and authorization
    const authContext = { isAuthenticated: true, user: { id: 'admin', email: 'admin@example.com', role: 'admin' as const } };
    
    const user = await Dependencies.getUserByIdUseCase.execute(id, authContext);
    
    return res.status(200).json({
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    handleError(error as Error, req, res);
  }
};

export default handleGetUserById; 