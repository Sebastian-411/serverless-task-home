import type { PrismaClient } from "../../../lib/generated/prisma";
import type { TaskStatus, TaskPriority } from "../domain";
import { Task } from "../domain";
import type { GetTasksFilters } from "../domain/ports/in/task-controller.port";
import type { TaskRepositoryPort } from "../application";

export class TaskRepositoryPrisma implements TaskRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca tareas según los filtros y permisos del usuario
   */
  async findTasks(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
    page: number,
    limit: number,
  ): Promise<{ tasks: Task[]; total: number }> {
    // Construir filtros de Prisma
    const where = this.buildWhereClause(filters, userId, userRole);

    // Obtener total de registros
    const total = await this.prisma.task.count({ where });

    // Obtener tareas con paginación
    const tasksData = await this.prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
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

    // Convertir datos de Prisma a entidades de dominio
    const tasks = tasksData.map((taskData) => this.mapToTask(taskData));

    return { tasks, total };
  }

  /**
   * Busca una tarea específica por ID
   */
  async findTaskById(id: string): Promise<Task | null> {
    const taskData = await this.prisma.task.findUnique({
      where: { id },
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

    if (!taskData) {
      return null;
    }

    return this.mapToTask(taskData);
  }

  /**
   * Construye la cláusula WHERE para la consulta de Prisma
   */
  private buildWhereClause(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
  ) {
    const where: any = {};

    // Filtros básicos
    if (filters.status) {
      where.status = filters.status as TaskStatus;
    }

    if (filters.priority) {
      where.priority = filters.priority as TaskPriority;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    // Filtros de fecha
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = filters.dueDateFrom;
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = filters.dueDateTo;
      }
    }

    // Filtros de autorización
    if (userRole !== "ADMIN") {
      // Los usuarios normales solo pueden ver tareas que crearon o les fueron asignadas
      where.OR = [{ createdBy: userId }, { assignedTo: userId }];
    }

    return where;
  }

  /**
   * Mapea los datos de Prisma a la entidad Task
   */
  private mapToTask(taskData: any): Task {
    return new Task({
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status as TaskStatus,
      priority: taskData.priority as TaskPriority,
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
      assignedTo: taskData.assignedTo || undefined,
      createdBy: taskData.createdBy,
      createdAt: taskData.createdAt.toISOString(),
      updatedAt: taskData.updatedAt.toISOString(),
    });
  }

  /**
   * Crea una nueva tarea
   */
  async createTask(data: any): Promise<Task> {
    const created = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || "PENDING",
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate,
        assignedTo: data.assignedTo,
        createdBy: data.createdBy,
      },
    });
    return this.mapToTask(created);
  }

  /**
   * Actualiza una tarea existente
   */
  async updateTask(id: string, data: any): Promise<Task> {
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        assignedTo: data.assignedTo,
      },
    });
    return this.mapToTask(updated);
  }

  /**
   * Elimina una tarea existente
   */
  async deleteTask(id: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id },
    });
  }
}
