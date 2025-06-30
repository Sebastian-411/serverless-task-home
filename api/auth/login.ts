// POST /auth/login
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Dependencies } from '../../core/common/config/dependencies';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authController = Dependencies.authController;
  return authController.login(req, res);
} 