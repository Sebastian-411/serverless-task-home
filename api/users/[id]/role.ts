// PATCH /users/[id]/role - Change user role (Admin only)
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { Dependencies } from '../../../core/common/config/dependencies';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userController = Dependencies.userController;
  return userController.changeUserRole(req, res);
} 