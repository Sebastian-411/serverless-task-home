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
import { Dependencies } from '../../shared/config/dependencies';
import { HandlerContext } from '../../shared/middlewares/request-handler.middleware';

// GET /tasks - List tasks based on user permissions
const handleGetTasks = Dependencies.createAuthenticatedEndpoint(['GET'])({}, 
  async (context: HandlerContext) => {
    // Execute use case - all authorization logic is handled there
    const tasks = await Dependencies.getTasksUseCase.execute(context.authContext);
    
    return {
      data: tasks,
      message: 'Tasks retrieved successfully',
      meta: { count: tasks.length }
    };
  }
);

// POST /tasks - Create a new task
const handleCreateTask = Dependencies.createAuthenticatedEndpoint(['POST'])({}, 
  async (context: HandlerContext) => {
    const { title, description, priority, dueDate, assignedTo } = context.validatedBody || {};
    
    // Create task data with user ID from auth context
    const taskData = {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      userId: context.authContext.user.id
    };
    
    // Execute use case
    const task = await Dependencies.createTaskUseCase.execute(taskData);
    
    return {
      data: task,
      message: 'Task created successfully'
    };
  }
);

// Ultra-fast router - O(1) method dispatch
export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET': return handleGetTasks(req, res);
    case 'POST': return handleCreateTask(req, res);
    default: return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are allowed'
    });
  }
} 