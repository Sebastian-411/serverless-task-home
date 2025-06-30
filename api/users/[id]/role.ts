// PATCH /users/[id]/role - Change user role (Admin only)
import { Dependencies } from '../../../core/common/config/dependencies';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userController = Dependencies.userController;
  
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only PATCH method is allowed'
    });
  }
  
  return userController.changeUserRole(req, res);
} 