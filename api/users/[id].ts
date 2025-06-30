// GET /users/[id], PUT /users/[id], DELETE /users/[id]
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Dependencies } from '../../core/common/config/dependencies';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userController = Dependencies.userController;
  
  switch (req.method) {
    case 'GET': 
      return userController.getUserById(req, res);
    case 'PUT': 
    case 'PATCH': 
      return userController.updateUser(req, res);
    case 'DELETE': 
      return userController.deleteUser(req, res);
    default: 
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only GET, PUT, PATCH, and DELETE methods are allowed'
      });
  }
} 