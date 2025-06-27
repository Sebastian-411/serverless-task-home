// GET /users/:id
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // GET /users/:id - Retrieve a specific user by ID
    return res.status(200).json({ 
      message: "hi, this still in development" 
    });
    
  } catch (error) {
    console.error('Error in users/[id]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 