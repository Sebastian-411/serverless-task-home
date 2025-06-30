import type { UpdateTaskData, TaskData } from "../domain";
import { Task } from "../domain";

import type { TaskRepositoryPort } from "./get-tasks.usecase";

/**
 * Use case for updating existing tasks.
 * Handles the business logic for task updates including authorization,
 * validation, and persistence. Ensures only authorized users can update tasks.
 */
export class UpdateTaskUseCase {
  /**
   * Creates a new UpdateTaskUseCase instance.
   *
   * @param taskRepository - Repository interface for task data operations
   */
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Updates an existing task with new data.
   *
   * This method performs the following steps:
   * 1. Retrieves the existing task from the repository
   * 2. Validates user authorization to update the task
   * 3. Updates the task details and validates the entity
   * 4. Persists the changes to the repository
   *
   * @param id - Unique identifier of the task to update
   * @param data - Partial task data containing fields to update (title, description, status, priority, dueDate, assignedTo)
   * @param userId - ID of the user requesting the update
   * @param userRole - Role of the user requesting the update ('ADMIN' or 'USER')
   * @returns Promise resolving to the updated task data
   * @throws Error if task is not found
   * @throws Error if user lacks permission to update the task
   * @throws ValidationError if task data is invalid after update
   * @throws DatabaseError if repository operation fails
   */
  async updateTask(
    id: string,
    data: Partial<UpdateTaskData>,
    userId: string,
    userRole: string,
  ): Promise<TaskData> {
    console.log("UpdateTaskUseCase.updateTask called", {
      method: "updateTask",
      taskId: id,
      userId,
      userRole,
      updateData: data,
    });

    // Find existing task
    console.log("UpdateTaskUseCase.updateTask - Finding existing task", {
      method: "updateTask",
      taskId: id,
    });
    const task = await this.taskRepository.findTaskById(id);
    if (!task) {
      console.error("UpdateTaskUseCase.updateTask - Task not found", {
        method: "updateTask",
        taskId: id,
        userId,
      });
      throw new Error("Task not found");
    }

    console.log("UpdateTaskUseCase.updateTask - Task found", {
      method: "updateTask",
      taskId: id,
      taskCreatedBy: task.createdBy,
      taskAssignedTo: task.assignedTo,
    });

    // Authorization check
    console.log("UpdateTaskUseCase.updateTask - Checking authorization", {
      method: "updateTask",
      taskId: id,
      userId,
      userRole,
      taskCreatedBy: task.createdBy,
      taskAssignedTo: task.assignedTo,
    });
    if (
      userRole !== "ADMIN" &&
      task.createdBy !== userId &&
      task.assignedTo !== userId
    ) {
      console.warn("UpdateTaskUseCase.updateTask - Authorization failed", {
        method: "updateTask",
        taskId: id,
        userId,
        userRole,
        taskCreatedBy: task.createdBy,
        taskAssignedTo: task.assignedTo,
        reason: "User lacks permission to update this task",
      });
      throw new Error("You don't have permission to update this task");
    }

    console.log("UpdateTaskUseCase.updateTask - Authorization passed", {
      method: "updateTask",
      taskId: id,
      userId,
      userRole,
    });

    // Update task data
    console.log("UpdateTaskUseCase.updateTask - Updating task details", {
      method: "updateTask",
      taskId: id,
      updateData: data,
    });
    task.updateDetails(data);

    console.log("UpdateTaskUseCase.updateTask - Validating task", {
      method: "updateTask",
      taskId: id,
    });
    task.validate();

    // Save to repository
    console.log("UpdateTaskUseCase.updateTask - Saving to repository", {
      method: "updateTask",
      taskId: id,
    });
    const updated = await this.taskRepository.updateTask(id, data);

    console.log("UpdateTaskUseCase.updateTask completed", {
      method: "updateTask",
      taskId: id,
      userId,
      updateSuccessful: true,
    });

    return updated.toJSON() as unknown as TaskData;
  }
}
