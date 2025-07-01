/**
 * Tests for DeleteTaskUseCase
 */
import { DeleteTaskUseCase } from "../../../../../core/task/application/delete-task.usecase";
import type { TaskData } from "../../../../../core/task/domain";
import { TaskPriority, TaskStatus } from "../../../../../core/task/domain";

describe("DeleteTaskUseCase", () => {
  let mockRepo: any;
  let usecase: DeleteTaskUseCase;
  let task: TaskData;

  beforeEach(() => {
    task = {
      id: "task-1",
      title: "Test",
      description: "Desc",
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: "2025-01-01T00:00:00.000Z",
      assignedTo: "user-2",
      createdBy: "user-1",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    mockRepo = {
      findTaskById: jest.fn(),
      deleteTask: jest.fn(),
    };
    usecase = new DeleteTaskUseCase(mockRepo);
  });

  it("elimina exitosamente como ADMIN", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    mockRepo.deleteTask.mockResolvedValue(undefined);
    await expect(
      usecase.deleteTask("task-1", "otro-user", "ADMIN"),
    ).resolves.toBeUndefined();
    expect(mockRepo.findTaskById).toHaveBeenCalledWith("task-1");
    expect(mockRepo.deleteTask).toHaveBeenCalledWith("task-1");
  });

  it("elimina exitosamente como USER creador", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    mockRepo.deleteTask.mockResolvedValue(undefined);
    await expect(
      usecase.deleteTask("task-1", "user-1", "USER"),
    ).resolves.toBeUndefined();
    expect(mockRepo.findTaskById).toHaveBeenCalledWith("task-1");
    expect(mockRepo.deleteTask).toHaveBeenCalledWith("task-1");
  });

  it("falla si la tarea no existe", async () => {
    mockRepo.findTaskById.mockResolvedValue(null);
    await expect(
      usecase.deleteTask("task-1", "user-1", "ADMIN"),
    ).rejects.toThrow("Task not found");
    expect(mockRepo.deleteTask).not.toHaveBeenCalled();
  });

  it("falla si USER no es creador", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    await expect(
      usecase.deleteTask("task-1", "otro-user", "USER"),
    ).rejects.toThrow("You don't have permission to delete this task");
    expect(mockRepo.deleteTask).not.toHaveBeenCalled();
  });

  it("falla si el repositorio lanza error", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    mockRepo.deleteTask.mockRejectedValue(new Error("DB error"));
    await expect(
      usecase.deleteTask("task-1", "user-1", "ADMIN"),
    ).rejects.toThrow("DB error");
    expect(mockRepo.findTaskById).toHaveBeenCalledWith("task-1");
    expect(mockRepo.deleteTask).toHaveBeenCalledWith("task-1");
  });
});
