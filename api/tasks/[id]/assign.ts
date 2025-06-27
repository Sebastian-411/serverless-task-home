// POST /tasks/:id/assign
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // POST /tasks/:id/assign - Assign a task to a user
    return res.status(200).json({ 
      message: "hi, this still in development" 
    });
    
  } catch (error) {
    console.error('Error in tasks/[id]/assign:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 