/**
 * /api/tasks/[id] - Task Management by ID
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

// GET /tasks/:id - Retrieve a specific task by ID
const handleGetTaskById = Dependencies.createAuthenticatedEndpoint(['GET'])({
  pathParam: { name: 'id', type: 'uuid' }
}, async (context: HandlerContext) => {
  const taskId = context.pathParam!;
  const user = context.authContext!.user;
  
  // Execute use case
  const task = await Dependencies.getTaskByIdUseCase.execute({
    taskId: taskId,
    requestingUserId: user.id,
    requestingUserRole: user.role
  });
  
  return {
    data: task,
    message: 'Task retrieved successfully'
  };
});

// PUT /tasks/:id - Update an existing task
const handleUpdateTask = Dependencies.createAuthenticatedEndpoint(['PUT'])({
  pathParam: { name: 'id', type: 'uuid' }
}, async (context: HandlerContext) => {
  const taskId = context.pathParam!;
  const updateData = context.validatedBody || {};
  
  // Get existing task
  const existingTask = await Dependencies.taskRepository.findById(taskId);
  
  if (!existingTask) {
    throw new Error('Task not found');
  }
  
  // Authorization: Users can only update their own tasks
  // Admins can update any task
  const user = context.authContext!.user;
  const canUpdate = user.role === 'admin' || existingTask.userId === user.id;
  
  if (!canUpdate) {
    throw new Error('Access denied to update this task');
  }
  
  // Update task
  const updatedTask = await Dependencies.taskRepository.update(taskId, updateData);
  
  return {
    data: updatedTask,
    message: 'Task updated successfully'
  };
});

// DELETE /tasks/:id - Delete a task
const handleDeleteTask = Dependencies.createAuthenticatedEndpoint(['DELETE'])({
  pathParam: { name: 'id', type: 'uuid' }
}, async (context: HandlerContext) => {
  const taskId = context.pathParam!;
  
  // Get existing task
  const existingTask = await Dependencies.taskRepository.findById(taskId);
  
  if (!existingTask) {
    throw new Error('Task not found');
  }
  
  // Authorization: Users can only delete their own tasks
  // Admins can delete any task
  const user = context.authContext!.user;
  const canDelete = user.role === 'admin' || existingTask.userId === user.id;
  
  if (!canDelete) {
    throw new Error('Access denied to delete this task');
  }
  
  // Delete task
  await Dependencies.taskRepository.delete(taskId);
  
  return {
    data: { id: taskId },
    message: 'Task deleted successfully'
  };
});

// Ultra-fast router - O(1) method dispatch
export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET': return handleGetTaskById(req, res);
    case 'PUT': return handleUpdateTask(req, res);
    case 'DELETE': return handleDeleteTask(req, res);
    default: return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET, PUT, and DELETE methods are allowed'
    });
  }
} 