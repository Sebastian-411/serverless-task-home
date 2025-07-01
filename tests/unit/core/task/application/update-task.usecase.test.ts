/**
 * Tests for UpdateTaskUseCase
 */
import { UpdateTaskUseCase } from "../../../../../core/task/application/update-task.usecase";
import { TaskPriority, TaskStatus } from "../../../../../core/task/domain";

describe("UpdateTaskUseCase", () => {
  let mockRepo: any;
  let usecase: UpdateTaskUseCase;
  let task: any;

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
      updateDetails: jest.fn(),
      validate: jest.fn(),
      toJSON: jest.fn(function () {
        return { ...this };
      }),
    };
    mockRepo = {
      findTaskById: jest.fn(),
      updateTask: jest.fn(),
    };
    usecase = new UpdateTaskUseCase(mockRepo);
  });

  it("actualiza exitosamente como ADMIN", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    mockRepo.updateTask.mockResolvedValue(task);
    const data = { title: "Nuevo título" };
    const result = await usecase.updateTask(
      "task-1",
      data,
      "otro-user",
      "ADMIN",
    );
    expect(mockRepo.findTaskById).toHaveBeenCalledWith("task-1");
    expect(task.updateDetails).toHaveBeenCalledWith(data);
    expect(task.validate).toHaveBeenCalled();
    expect(mockRepo.updateTask).toHaveBeenCalledWith("task-1", data);
    expect(result.title).toBe("Test");
  });

  it("actualiza exitosamente como USER creador", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    mockRepo.updateTask.mockResolvedValue(task);
    const data = { description: "Nueva desc" };
    const result = await usecase.updateTask("task-1", data, "user-1", "USER");
    expect(mockRepo.findTaskById).toHaveBeenCalledWith("task-1");
    expect(task.updateDetails).toHaveBeenCalledWith(data);
    expect(task.validate).toHaveBeenCalled();
    expect(mockRepo.updateTask).toHaveBeenCalledWith("task-1", data);
    expect(result.description).toBe("Desc");
  });

  it("actualiza exitosamente como USER asignado", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    mockRepo.updateTask.mockResolvedValue(task);
    const data = { priority: TaskPriority.LOW };
    const result = await usecase.updateTask("task-1", data, "user-2", "USER");
    expect(mockRepo.findTaskById).toHaveBeenCalledWith("task-1");
    expect(task.updateDetails).toHaveBeenCalledWith(data);
    expect(task.validate).toHaveBeenCalled();
    expect(mockRepo.updateTask).toHaveBeenCalledWith("task-1", data);
    expect(result.priority).toBe(TaskPriority.HIGH);
  });

  it("falla si la tarea no existe", async () => {
    mockRepo.findTaskById.mockResolvedValue(null);
    await expect(
      usecase.updateTask("task-1", { title: "x" }, "user-1", "ADMIN"),
    ).rejects.toThrow("Task not found");
    expect(mockRepo.updateTask).not.toHaveBeenCalled();
  });

  it("falla si USER no tiene permisos", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    await expect(
      usecase.updateTask("task-1", { title: "x" }, "otro-user", "USER"),
    ).rejects.toThrow("You don't have permission to update this task");
    expect(mockRepo.updateTask).not.toHaveBeenCalled();
  });

  it("falla si el repositorio lanza error", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    mockRepo.updateTask.mockRejectedValue(new Error("DB error"));
    await expect(
      usecase.updateTask("task-1", { title: "x" }, "user-1", "ADMIN"),
    ).rejects.toThrow("DB error");
    expect(mockRepo.findTaskById).toHaveBeenCalledWith("task-1");
    expect(mockRepo.updateTask).toHaveBeenCalledWith("task-1", { title: "x" });
  });

  it("falla si la validación de la entidad falla", async () => {
    mockRepo.findTaskById.mockResolvedValue(task);
    task.validate.mockImplementation(() => {
      throw new Error("Validation error");
    });
    await expect(
      usecase.updateTask("task-1", { title: "x" }, "user-1", "ADMIN"),
    ).rejects.toThrow("Validation error");
    expect(mockRepo.updateTask).not.toHaveBeenCalled();
  });
});
