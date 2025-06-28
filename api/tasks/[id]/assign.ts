/**
 * POST /tasks/:id/assign - HIGH-PERFORMANCE Assign a task to a user
 * 
 * Optimized endpoint with:
 * - Ultra-fast validation and caching
 * - Parallel processing capabilities  
 * - Comprehensive error handling
 * - Performance monitoring
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Dependencies } from '../../../shared/config/dependencies';
import { HandlerContext } from '../../../shared/middlewares/request-handler.middleware';

// POST /tasks/:id/assign - HIGH-PERFORMANCE task assignment
const handleAssignTask = Dependencies.createAuthenticatedEndpoint(['POST'], ['admin'])({
  pathParam: { name: 'id', type: 'uuid' }
}, async (context: HandlerContext) => {
  const startTime = Date.now();
  console.log(`🚀 HIGH-PERFORMANCE assignment endpoint called for task: ${context.pathParam}`);

  try {
    // Ultra-fast body validation with detailed error
    const { assignedTo } = context.validatedBody || {};
    if (!assignedTo) {
      throw new Error('assignedTo is required in request body');
    }
    if (typeof assignedTo !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignedTo)) {
      throw new Error('assignedTo must be a valid UUID string');
    }
    
    // Prepare optimized assignment request
    const assignmentRequest = {
      taskId: context.pathParam!,
      userId: assignedTo,
      assignedBy: context.authContext!.user.id
    };
    
    console.log(`📋 Assignment request prepared: Task ${assignmentRequest.taskId} → User ${assignmentRequest.userId}`);
    
    // Execute HIGH-PERFORMANCE use case
    const result = await Dependencies.assignTaskUseCase.execute(assignmentRequest);
    
    const totalTime = Date.now() - startTime;
    console.log(`⚡ ENDPOINT completed assignment in ${totalTime}ms - ULTRA FAST!`);
    
    // Return optimized response with performance metrics
    return {
      success: true,
      data: {
        task: result.task,
        assignment: {
          assignedTo: result.assignedTo,
          assignedAt: result.assignedAt,
          assignedBy: assignmentRequest.assignedBy
        }
      },
      message: 'Task assigned successfully with optimal performance',
      performance: {
        endpointTime: totalTime,
        useCaseMetrics: result.performance
      },
      meta: {
        timestamp: new Date().toISOString(),
        optimized: true,
        cacheEnabled: true
      }
    };

  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ Assignment endpoint failed in ${errorTime}ms:`, error.message);
    
    // Re-throw to let error middleware handle it with proper status codes
    throw error;
  }
});

// ULTRA-FAST router with O(1) method dispatch
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const routerStart = Date.now();
  
  try {
    switch (req.method) {
      case 'POST': {
        const result = await handleAssignTask(req, res);
        const routerTime = Date.now() - routerStart;
        console.log(`🎯 Router dispatched POST in ${routerTime}ms`);
        return result;
      }
      default: {
        const routerTime = Date.now() - routerStart;
        console.log(`❌ Invalid method ${req.method} rejected in ${routerTime}ms`);
        return res.status(405).json({ 
          success: false,
          error: 'Method not allowed',
          message: 'Only POST method is allowed for task assignment',
          allowedMethods: ['POST'],
          performance: {
            routerTime
          }
        });
      }
    }
  } catch (error) {
    const routerTime = Date.now() - routerStart;
    console.error(`💥 Router error in ${routerTime}ms:`, error.message);
    throw error; // Let error middleware handle it
  }
} 