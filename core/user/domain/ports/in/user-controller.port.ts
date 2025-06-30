import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface UserControllerPort {
  getUsers(req: VercelRequest, res: VercelResponse): Promise<void>;
  createUser(req: VercelRequest, res: VercelResponse): Promise<void>;
  getUserById(req: VercelRequest, res: VercelResponse): Promise<void>;
  updateUser(req: VercelRequest, res: VercelResponse): Promise<void>;
  deleteUser(req: VercelRequest, res: VercelResponse): Promise<void>;
  changeUserRole(req: VercelRequest, res: VercelResponse): Promise<void>;
} 