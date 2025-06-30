import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface AuthControllerPort {
  login(req: VercelRequest, res: VercelResponse): Promise<void>;
} 