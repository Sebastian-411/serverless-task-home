/**
 * Get Task By ID Use Case
 * Handles the business logic for retrieving a single task by ID
 */

const TaskDomain = require('../domain/task.entity');
const CustomValidationError = require('../../../shared/domain/exceptions/validation.error');

export interface GetTaskByIdRequest {
  taskId: string;
  requestingUserId: string;
  requestingUserRole: string;
}

export class GetTaskByIdUseCase {
  private taskRepository: any;

  constructor(taskRepository: any) {
    this.taskRepository = taskRepository;
  }

  async execute(request: GetTaskByIdRequest) {
    try {
      // 1. Validate input
      await this._validateInput(request);

      // 2. Get task from repository
      const taskData = await this.taskRepository.findById(request.taskId);
      
      if (!taskData) {
        throw new CustomValidationError('Task not found');
      }

      // 3. Convert to domain entity (this normalizes the data)
      const task = TaskDomain.fromPrisma(taskData);

      // 4. Authorization check
      this._checkAccess(task, request.requestingUserId, request.requestingUserRole);

      // 5. Return normalized task data
      return task.toJSON();

    } catch (error) {
      if (error instanceof CustomValidationError) {
        throw error;
      }
      throw new Error(`Failed to get task: ${error.message}`);
    }
  }

  /**
   * Validate input data
   * @private
   */
  async _validateInput(request: GetTaskByIdRequest) {
    const errors = [];

    if (!request.taskId || typeof request.taskId !== 'string') {
      errors.push('Task ID is required and must be a string');
    }

    if (!request.requestingUserId || typeof request.requestingUserId !== 'string') {
      errors.push('Requesting user ID is required and must be a string');
    }

    if (!request.requestingUserRole || typeof request.requestingUserRole !== 'string') {
      errors.push('Requesting user role is required and must be a string');
    }

    if (errors.length > 0) {
      throw new CustomValidationError('Get task validation failed', errors);
    }
  }

  /**
   * Check if user has access to the task
   * @private
   */
  _checkAccess(task: any, requestingUserId: string, requestingUserRole: string) {
    // Authorization: Users can only see their own tasks or tasks assigned to them
    // Admins can see all tasks
    const canAccess = requestingUserRole === 'admin' || 
                     task.userId === requestingUserId || 
                     task.assignedTo === requestingUserId;

    if (!canAccess) {
      throw new CustomValidationError('Access denied to this task');
    }
  }
} 