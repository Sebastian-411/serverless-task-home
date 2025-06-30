import { Task, TaskData } from "../domain";

import type { TaskRepositoryPort } from "./get-tasks.usecase";

/**
 * Use case for deleting a specific task with authorization checks.
 * Handles the business logic for task deletion including permission validation.
 * Ensures users can only delete tasks they are authorized to remove.
 */
export class DeleteTaskUseCase {
  /**
   * Creates a new DeleteTaskUseCase instance.
   *
   * @param taskRepository - Repository interface for task data operations
   */
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Deletes a specific task by ID based on user permissions.
   *
   * This method performs the following steps:
   * 1. Retrieves the task from the repository to verify it exists
   * 2. Validates user authorization to delete the task
   * 3. Performs the deletion operation
   *
   * Authorization rules:
   * - Administrators can delete any task
   * - Regular users can only delete tasks they created
   *
   * @param id - Unique identifier of the task to delete
   * @param userId - ID of the authenticated user making the request
   * @param userRole - Role of the authenticated user ('ADMIN' or 'USER')
   * @returns Promise that resolves when deletion is complete
   * @throws Error if task is not found
   * @throws Error if user lacks permission to delete the task
   * @throws DatabaseError if repository operation fails
   */
  async deleteTask(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    console.log("DeleteTaskUseCase.deleteTask called", {
      method: "deleteTask",
      taskId: id,
      userId,
      userRole,
    });

    // Find existing task
    console.log(
      "DeleteTaskUseCase.deleteTask - Retrieving task from repository",
      {
        method: "deleteTask",
        taskId: id,
      },
    );
    const task = await this.taskRepository.findTaskById(id);

    if (!task) {
      console.warn("DeleteTaskUseCase.deleteTask - Task not found", {
        method: "deleteTask",
        taskId: id,
        userId,
        userRole,
        reason: "Task does not exist in the system",
      });
      throw new Error("Task not found");
    }

    console.log("DeleteTaskUseCase.deleteTask - Task found", {
      method: "deleteTask",
      taskId: id,
      taskCreatedBy: task.createdBy,
      taskTitle: task.title,
    });

    // Authorization check
    console.log("DeleteTaskUseCase.deleteTask - Checking authorization", {
      method: "deleteTask",
      taskId: id,
      userId,
      userRole,
      taskCreatedBy: task.createdBy,
    });

    if (userRole !== "ADMIN" && task.createdBy !== userId) {
      console.warn("DeleteTaskUseCase.deleteTask - Authorization failed", {
        method: "deleteTask",
        taskId: id,
        userId,
        userRole,
        taskCreatedBy: task.createdBy,
        reason: "User is not admin and did not create this task",
      });
      throw new Error("You don't have permission to delete this task");
    }

    console.log("DeleteTaskUseCase.deleteTask - Authorization passed", {
      method: "deleteTask",
      taskId: id,
      userId,
      userRole,
    });

    // Delete task
    console.log("DeleteTaskUseCase.deleteTask - Performing deletion", {
      method: "deleteTask",
      taskId: id,
    });
    await this.taskRepository.deleteTask(id);

    console.log("DeleteTaskUseCase.deleteTask completed", {
      method: "deleteTask",
      taskId: id,
      userId,
      userRole,
      deletionSuccessful: true,
    });
  }
}
