// GET, PUT, DELETE /tasks/:id
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  try {
    switch (req.method) {
      case 'GET':
        // GET /tasks/:id - Retrieve a specific task by ID
        return res.status(200).json({ 
          message: "hi, this still in development" 
        });
        
      case 'PUT':
        // PUT /tasks/:id - Update an existing task
        return res.status(200).json({ 
          message: "hi, this still in development" 
        });
        
      case 'DELETE':
        // DELETE /tasks/:id - Delete a task
        return res.status(200).json({ 
          message: "hi, this still in development" 
        });
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in tasks/[id]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 