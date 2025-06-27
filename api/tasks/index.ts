/**
 * /api/tasks - Task Management Endpoints
 * 
 * Using Hexagonal Architecture with:
 * - Domain entities and business rules
 * - Application use cases  
 * - Infrastructure adapters
 * - Clean separation of concerns
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET':
        // GET /tasks - Retrieve all tasks with pagination and filtering options
        return res.status(200).json({ 
          message: "hi, this still in development" 
        });
        
      case 'POST':
        // POST /tasks - Create a new task
        return res.status(200).json({ 
          message: "hi, this still in development" 
        });
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in tasks:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 