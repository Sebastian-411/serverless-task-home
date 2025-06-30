// GET /users (list), POST /users (create)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Dependencies } from '../../core/common/config/dependencies';

// Ultra-fast router - O(1) method dispatch
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userController = Dependencies.userController;
  
  switch (req.method) {
    case 'GET': 
      return userController.getUsers(req, res);
    case 'POST': 
      return userController.createUser(req, res);
    default: 
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only GET and POST methods are allowed'
      });
  }
} 