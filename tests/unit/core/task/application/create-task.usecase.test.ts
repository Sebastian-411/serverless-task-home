/**
 * Tests for CreateTaskUseCase
 */
import {
  CreateTaskUseCase,
  type CreateTaskInput,
  type TaskRepositoryPort,
} from "../../../../../core/task/application/create-task.usecase";
import { TaskStatus, TaskPriority } from "../../../../../core/task/domain";

describe("CreateTaskUseCase", () => {
  let mockRepo: jest.Mocked<TaskRepositoryPort>;
  let usecase: CreateTaskUseCase;
  let mockTaskEntity: any;

  beforeEach(() => {
    mockRepo = {
      createTask: jest.fn(),
    };
    usecase = new CreateTaskUseCase(mockRepo);
    mockTaskEntity = {
      id: "task-1",
      title: "Test Task",
      description: "Test Desc",
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: new Date("2025-01-01"),
      assignedTo: "user-2",
      createdBy: "user-1",
      toJSON: jest.fn(function () {
        return { ...this };
      }),
    };
  });

  const baseInput: CreateTaskInput = {
    title: "Test Task",
    description: "Test Desc",
    createdBy: "user-1",
  };

  it("crea una tarea exitosamente con todos los campos", async () => {
    const input: CreateTaskInput = {
      ...baseInput,
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: new Date("2025-01-01"),
      assignedTo: "user-2",
    };
    mockRepo.createTask.mockResolvedValue(mockTaskEntity);
    const result = await usecase.createTask(input, "ADMIN");
    expect(mockRepo.createTask).toHaveBeenCalledWith(input);
    expect(result).toMatchObject({
      id: "task-1",
      title: "Test Task",
      description: "Test Desc",
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: new Date("2025-01-01"),
      assignedTo: "user-2",
      createdBy: "user-1",
    });
  });

  it("crea una tarea exitosamente solo con los campos requeridos", async () => {
    mockRepo.createTask.mockResolvedValue(mockTaskEntity);
    const result = await usecase.createTask(baseInput, "USER");
    expect(mockRepo.createTask).toHaveBeenCalledWith(baseInput);
    expect(result.title).toBe("Test Task");
    expect(result.description).toBe("Test Desc");
    expect(result.createdBy).toBe("user-1");
  });

  it("lanza error si falta el título", async () => {
    const input = { ...baseInput, title: undefined as any };
    await expect(usecase.createTask(input, "USER")).rejects.toThrow(
      "Required fields are missing",
    );
    expect(mockRepo.createTask).not.toHaveBeenCalled();
  });

  it("lanza error si falta la descripción", async () => {
    const input = { ...baseInput, description: undefined as any };
    await expect(usecase.createTask(input, "USER")).rejects.toThrow(
      "Required fields are missing",
    );
    expect(mockRepo.createTask).not.toHaveBeenCalled();
  });

  it("lanza error si el repositorio falla", async () => {
    mockRepo.createTask.mockRejectedValue(new Error("DB error"));
    await expect(usecase.createTask(baseInput, "ADMIN")).rejects.toThrow(
      "DB error",
    );
    expect(mockRepo.createTask).toHaveBeenCalledWith(baseInput);
  });

  it("pasa correctamente el rol de usuario (ADMIN)", async () => {
    mockRepo.createTask.mockResolvedValue(mockTaskEntity);
    await usecase.createTask(baseInput, "ADMIN");
    expect(mockRepo.createTask).toHaveBeenCalledWith(baseInput);
  });

  it("pasa correctamente el rol de usuario (USER)", async () => {
    mockRepo.createTask.mockResolvedValue(mockTaskEntity);
    await usecase.createTask(baseInput, "USER");
    expect(mockRepo.createTask).toHaveBeenCalledWith(baseInput);
  });
});
