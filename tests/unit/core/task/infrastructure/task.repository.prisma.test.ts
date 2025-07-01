import { TaskRepositoryPrisma } from "../../../../../core/task/infrastructure/task.repository.prisma";
import {
  Task,
  TaskStatus,
  TaskPriority,
} from "../../../../../core/task/domain";
import type { GetTasksFilters } from "../../../../../core/task/domain/ports/in/task-controller.port";

// Mock Prisma client
const mockPrisma = {
  task: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe("TaskRepositoryPrisma", () => {
  let repository: TaskRepositoryPrisma;
  let mockTaskData: any;
  let mockTask: Task;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TaskRepositoryPrisma(mockPrisma as any);

    // Mock task data
    mockTaskData = {
      id: "task-1",
      title: "Test Task",
      description: "Test Description",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date("2024-01-15"),
      assignedTo: "user-1",
      createdBy: "user-2",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
      assignedUser: {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
      },
      creator: {
        id: "user-2",
        name: "Jane Smith",
        email: "jane@example.com",
      },
    };

    mockTask = new Task({
      id: "task-1",
      title: "Test Task",
      description: "Test Description",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: "2024-01-15T00:00:00.000Z",
      assignedTo: "user-1",
      createdBy: "user-2",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
    });
  });

  describe("findTasks", () => {
    it("encuentra tareas con filtros básicos para admin", async () => {
      const filters: GetTasksFilters = {
        status: "PENDING",
        priority: "HIGH",
        assignedTo: "user-1",
        createdBy: "user-2",
      };

      mockPrisma.task.count.mockResolvedValue(5);
      mockPrisma.task.findMany.mockResolvedValue([mockTaskData]);

      const result = await repository.findTasks(
        filters,
        "admin-user",
        "ADMIN",
        1,
        10,
      );

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          status: "PENDING",
          priority: "HIGH",
          assignedTo: "user-1",
          createdBy: "user-2",
        },
      });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          status: "PENDING",
          priority: "HIGH",
          assignedTo: "user-1",
          createdBy: "user-2",
        },
        skip: 0,
        take: 10,
        orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(5);
      expect(result.tasks[0]).toBeInstanceOf(Task);
    });

    it("encuentra tareas con filtros de fecha", async () => {
      const filters: GetTasksFilters = {
        dueDateFrom: new Date("2024-01-01"),
        dueDateTo: new Date("2024-01-31"),
      };

      mockPrisma.task.count.mockResolvedValue(3);
      mockPrisma.task.findMany.mockResolvedValue([mockTaskData]);

      const result = await repository.findTasks(
        filters,
        "user-1",
        "USER",
        1,
        10,
      );

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          dueDate: {
            gte: new Date("2024-01-01"),
            lte: new Date("2024-01-31"),
          },
          OR: [{ createdBy: "user-1" }, { assignedTo: "user-1" }],
        },
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(3);
    });

    it("aplica filtros de autorización para usuarios regulares", async () => {
      const filters: GetTasksFilters = {};

      mockPrisma.task.count.mockResolvedValue(2);
      mockPrisma.task.findMany.mockResolvedValue([mockTaskData]);

      const result = await repository.findTasks(
        filters,
        "user-1",
        "USER",
        2,
        5,
      );

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          OR: [{ createdBy: "user-1" }, { assignedTo: "user-1" }],
        },
      });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ createdBy: "user-1" }, { assignedTo: "user-1" }],
        },
        skip: 5,
        take: 5,
        orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it("maneja tareas sin fecha de vencimiento", async () => {
      const taskWithoutDueDate = {
        ...mockTaskData,
        dueDate: null,
      };

      const filters: GetTasksFilters = {};

      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([taskWithoutDueDate]);

      const result = await repository.findTasks(
        filters,
        "user-1",
        "ADMIN",
        1,
        10,
      );

      expect(result.tasks[0].dueDate).toBeUndefined();
    });
  });

  describe("findTaskById", () => {
    it("encuentra tarea por ID exitosamente", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskData);

      const result = await repository.findTaskById("task-1");

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: "task-1" },
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(result).toBeInstanceOf(Task);
      expect(result?.id).toBe("task-1");
      expect(result?.title).toBe("Test Task");
    });

    it("retorna null cuando la tarea no existe", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const result = await repository.findTaskById("non-existent");

      expect(result).toBeNull();
    });

    it("maneja tarea sin usuario asignado", async () => {
      const taskWithoutAssignee = {
        ...mockTaskData,
        assignedTo: null,
        assignedUser: null,
      };

      mockPrisma.task.findUnique.mockResolvedValue(taskWithoutAssignee);

      const result = await repository.findTaskById("task-1");

      expect(result?.assignedTo).toBeUndefined();
    });
  });

  describe("createTask", () => {
    it("crea tarea exitosamente con todos los campos", async () => {
      const taskData = {
        title: "New Task",
        description: "New Description",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: "2024-02-01",
        assignedTo: "user-1",
        createdBy: "user-2",
      };

      const createdTaskData = {
        ...mockTaskData,
        ...taskData,
        id: "new-task-id",
        dueDate: new Date("2024-02-01"),
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-03"),
      };

      mockPrisma.task.create.mockResolvedValue(createdTaskData);

      const result = await repository.createTask(taskData);

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "New Task",
          description: "New Description",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          dueDate: "2024-02-01",
          assignedTo: "user-1",
          createdBy: "user-2",
        },
      });

      expect(result).toBeInstanceOf(Task);
      expect(result.title).toBe("New Task");
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(result.priority).toBe(TaskPriority.HIGH);
    });

    it("crea tarea con valores por defecto", async () => {
      const taskData = {
        title: "New Task",
        description: "New Description",
        createdBy: "user-2",
      };

      const createdTaskData = {
        ...mockTaskData,
        ...taskData,
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        id: "new-task-id",
      };

      mockPrisma.task.create.mockResolvedValue(createdTaskData);

      const result = await repository.createTask(taskData);

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "New Task",
          description: "New Description",
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          dueDate: undefined,
          assignedTo: undefined,
          createdBy: "user-2",
        },
      });

      expect(result.status).toBe(TaskStatus.PENDING);
      expect(result.priority).toBe(TaskPriority.MEDIUM);
    });

    it("maneja error al crear tarea", async () => {
      const taskData = {
        title: "New Task",
        createdBy: "user-2",
      };

      const error = new Error("Database constraint violation");
      mockPrisma.task.create.mockRejectedValue(error);

      await expect(repository.createTask(taskData)).rejects.toThrow(
        "Database constraint violation",
      );

      expect(mockPrisma.task.create).toHaveBeenCalled();
    });
  });

  describe("updateTask", () => {
    it("actualiza tarea exitosamente", async () => {
      const updateData = {
        title: "Updated Task",
        description: "Updated Description",
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW,
        dueDate: "2024-03-01",
        assignedTo: "user-3",
      };

      const updatedTaskData = {
        ...mockTaskData,
        ...updateData,
        dueDate: new Date("2024-03-01"),
        updatedAt: new Date("2024-01-04"),
      };

      mockPrisma.task.update.mockResolvedValue(updatedTaskData);

      const result = await repository.updateTask("task-1", updateData);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {
          title: "Updated Task",
          description: "Updated Description",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.LOW,
          dueDate: "2024-03-01",
          assignedTo: "user-3",
        },
      });

      expect(result).toBeInstanceOf(Task);
      expect(result.title).toBe("Updated Task");
      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.priority).toBe(TaskPriority.LOW);
    });

    it("actualiza tarea con campos parciales", async () => {
      const updateData = {
        title: "Updated Task",
        status: TaskStatus.IN_PROGRESS,
      };

      const updatedTaskData = {
        ...mockTaskData,
        ...updateData,
      };

      mockPrisma.task.update.mockResolvedValue(updatedTaskData);

      const result = await repository.updateTask("task-1", updateData);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {
          title: "Updated Task",
          description: undefined,
          status: TaskStatus.IN_PROGRESS,
          priority: undefined,
          dueDate: undefined,
          assignedTo: undefined,
        },
      });

      expect(result.title).toBe("Updated Task");
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("maneja error al actualizar tarea", async () => {
      const updateData = {
        title: "Updated Task",
      };

      const error = new Error("Task not found");
      mockPrisma.task.update.mockRejectedValue(error);

      await expect(
        repository.updateTask("non-existent", updateData),
      ).rejects.toThrow("Task not found");

      expect(mockPrisma.task.update).toHaveBeenCalled();
    });
  });

  describe("deleteTask", () => {
    it("elimina tarea exitosamente", async () => {
      mockPrisma.task.delete.mockResolvedValue(undefined);

      await repository.deleteTask("task-1");

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: "task-1" },
      });
    });

    it("maneja error al eliminar tarea", async () => {
      const error = new Error("Task not found");
      mockPrisma.task.delete.mockRejectedValue(error);

      await expect(repository.deleteTask("non-existent")).rejects.toThrow(
        "Task not found",
      );

      expect(mockPrisma.task.delete).toHaveBeenCalled();
    });
  });

  describe("findRecentTasks", () => {
    it("encuentra tareas recientes exitosamente", async () => {
      const recentTasksData = [
        { ...mockTaskData, id: "task-1" },
        { ...mockTaskData, id: "task-2" },
      ];

      mockPrisma.task.findMany.mockResolvedValue(recentTasksData);

      const result = await repository.findRecentTasks(5);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Task);
      expect(result[1]).toBeInstanceOf(Task);
    });

    it("maneja error al buscar tareas recientes", async () => {
      const error = new Error("Database connection failed");
      mockPrisma.task.findMany.mockRejectedValue(error);

      await expect(repository.findRecentTasks(5)).rejects.toThrow(
        "Database connection failed",
      );

      expect(mockPrisma.task.findMany).toHaveBeenCalled();
    });

    it("retorna array vacío cuando no hay tareas", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await repository.findRecentTasks(5);

      expect(result).toHaveLength(0);
    });
  });

  describe("findRecentTasksByUser", () => {
    it("encuentra tareas recientes de un usuario exitosamente", async () => {
      const userTasksData = [
        { ...mockTaskData, id: "task-1", assignedTo: "user-1" },
        { ...mockTaskData, id: "task-2", assignedTo: "user-1" },
      ];

      mockPrisma.task.findMany.mockResolvedValue(userTasksData);

      const result = await repository.findRecentTasksByUser("user-1", 3);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { assignedTo: "user-1" },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Task);
      expect(result[1]).toBeInstanceOf(Task);
      expect(result[0].assignedTo).toBe("user-1");
      expect(result[1].assignedTo).toBe("user-1");
    });

    it("maneja error al buscar tareas de usuario", async () => {
      const error = new Error("Database connection failed");
      mockPrisma.task.findMany.mockRejectedValue(error);

      await expect(
        repository.findRecentTasksByUser("user-1", 3),
      ).rejects.toThrow("Database connection failed");

      expect(mockPrisma.task.findMany).toHaveBeenCalled();
    });

    it("retorna array vacío cuando el usuario no tiene tareas", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const result = await repository.findRecentTasksByUser(
        "user-without-tasks",
        3,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("buildWhereClause", () => {
    it("construye filtros básicos correctamente", async () => {
      const filters: GetTasksFilters = {
        status: "PENDING",
        priority: "HIGH",
        assignedTo: "user-1",
        createdBy: "user-2",
      };

      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([mockTaskData]);

      await repository.findTasks(filters, "admin-user", "ADMIN", 1, 10);

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          status: "PENDING",
          priority: "HIGH",
          assignedTo: "user-1",
          createdBy: "user-2",
        },
      });
    });

    it("construye filtros de fecha correctamente", async () => {
      const filters: GetTasksFilters = {
        dueDateFrom: new Date("2024-01-01"),
        dueDateTo: new Date("2024-01-31"),
      };

      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([mockTaskData]);

      await repository.findTasks(filters, "admin-user", "ADMIN", 1, 10);

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          dueDate: {
            gte: new Date("2024-01-01"),
            lte: new Date("2024-01-31"),
          },
        },
      });
    });

    it("construye filtros de fecha solo con fecha desde", async () => {
      const filters: GetTasksFilters = {
        dueDateFrom: new Date("2024-01-01"),
      };

      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([mockTaskData]);

      await repository.findTasks(filters, "admin-user", "ADMIN", 1, 10);

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          dueDate: {
            gte: new Date("2024-01-01"),
          },
        },
      });
    });

    it("construye filtros de fecha solo con fecha hasta", async () => {
      const filters: GetTasksFilters = {
        dueDateTo: new Date("2024-01-31"),
      };

      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([mockTaskData]);

      await repository.findTasks(filters, "admin-user", "ADMIN", 1, 10);

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          dueDate: {
            lte: new Date("2024-01-31"),
          },
        },
      });
    });

    it("aplica filtros de autorización para usuarios regulares", async () => {
      const filters: GetTasksFilters = {};

      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([mockTaskData]);

      await repository.findTasks(filters, "user-1", "USER", 1, 10);

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          OR: [{ createdBy: "user-1" }, { assignedTo: "user-1" }],
        },
      });
    });

    it("combina filtros básicos con autorización", async () => {
      const filters: GetTasksFilters = {
        status: "PENDING",
        priority: "HIGH",
      };

      mockPrisma.task.count.mockResolvedValue(1);
      mockPrisma.task.findMany.mockResolvedValue([mockTaskData]);

      await repository.findTasks(filters, "user-1", "USER", 1, 10);

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          status: "PENDING",
          priority: "HIGH",
          OR: [{ createdBy: "user-1" }, { assignedTo: "user-1" }],
        },
      });
    });
  });

  describe("mapToTask", () => {
    it("mapea datos de Prisma a entidad Task correctamente", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskData);

      const result = await repository.findTaskById("task-1");

      expect(result).toBeInstanceOf(Task);
      expect(result?.id).toBe("task-1");
      expect(result?.title).toBe("Test Task");
      expect(result?.description).toBe("Test Description");
      expect(result?.status).toBe(TaskStatus.PENDING);
      expect(result?.priority).toBe(TaskPriority.MEDIUM);
      expect(result?.dueDate).toBe("2024-01-15T00:00:00.000Z");
      expect(result?.assignedTo).toBe("user-1");
      expect(result?.createdBy).toBe("user-2");
      expect(result?.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(result?.updatedAt).toBe("2024-01-02T00:00:00.000Z");
    });

    it("mapea tarea sin fecha de vencimiento", async () => {
      const taskWithoutDueDate = {
        ...mockTaskData,
        dueDate: null,
      };

      mockPrisma.task.findUnique.mockResolvedValue(taskWithoutDueDate);

      const result = await repository.findTaskById("task-1");

      expect(result?.dueDate).toBeUndefined();
    });

    it("mapea tarea sin usuario asignado", async () => {
      const taskWithoutAssignee = {
        ...mockTaskData,
        assignedTo: null,
      };

      mockPrisma.task.findUnique.mockResolvedValue(taskWithoutAssignee);

      const result = await repository.findTaskById("task-1");

      expect(result?.assignedTo).toBeUndefined();
    });
  });
});
