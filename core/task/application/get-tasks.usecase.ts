import type { Task, TaskData } from "../domain";
import { TaskStatus, TaskPriority } from "../domain";
import type {
  GetTasksFilters,
  GetTasksResult,
} from "../domain/ports/in/task-controller.port";
import { TaskControllerPort } from "../domain/ports/in/task-controller.port";

export interface TaskRepositoryPort {
  findTasks(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
    page: number,
    limit: number,
  ): Promise<{ tasks: Task[]; total: number }>;
  findTaskById(id: string): Promise<Task | null>;
  updateTask(id: string, data: any): Promise<Task>;
  deleteTask(id: string): Promise<void>;
}

export class GetTasksUseCase {
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Obtiene las tareas según los filtros y permisos del usuario
   * @param filters - Filtros opcionales para las tareas
   * @param userId - ID del usuario autenticado
   * @param userRole - Rol del usuario autenticado
   * @param page - Número de página (opcional, por defecto 1)
   * @param limit - Límite de elementos por página (opcional, por defecto 10)
   * @returns Promise con las tareas y metadatos de paginación
   */
  async getTasks(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<GetTasksResult> {
    // Validar parámetros
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    // Aplicar filtros de autorización según el rol (antes de validar)
    const authorizedFilters = this.applyAuthorizationFilters(
      filters,
      userId,
      userRole,
    );

    // Validar filtros después de la autorización
    const validatedFilters = this.validateFilters(authorizedFilters);

    // Obtener tareas del repositorio
    const result = await this.taskRepository.findTasks(
      validatedFilters,
      userId,
      userRole,
      page,
      limit,
    );

    if (!result) {
      throw new Error("Error al obtener tareas del repositorio");
    }

    const { tasks, total } = result;

    // Convertir entidades a DTOs
    const taskData = tasks.map((task) => task.toJSON() as unknown as TaskData);

    return {
      tasks: taskData,
      total,
      page,
      limit,
    };
  }

  /**
   * Valida y normaliza los filtros de entrada
   */
  private validateFilters(filters: GetTasksFilters): GetTasksFilters {
    const validated: GetTasksFilters = {};

    // Validar status
    if (
      filters.status &&
      Object.values(TaskStatus).includes(filters.status as TaskStatus)
    ) {
      validated.status = filters.status;
    }

    // Validar priority
    if (
      filters.priority &&
      Object.values(TaskPriority).includes(filters.priority as TaskPriority)
    ) {
      validated.priority = filters.priority;
    }

    // Validar assignedTo (puede ser cualquier string no vacío)
    if (filters.assignedTo && filters.assignedTo.trim()) {
      validated.assignedTo = filters.assignedTo;
    }

    // Validar createdBy (puede ser cualquier string no vacío)
    if (filters.createdBy && filters.createdBy.trim()) {
      validated.createdBy = filters.createdBy;
    }

    // Validar fechas
    if (
      filters.dueDateFrom &&
      !isNaN(new Date(filters.dueDateFrom).getTime())
    ) {
      validated.dueDateFrom = new Date(filters.dueDateFrom);
    }

    if (filters.dueDateTo && !isNaN(new Date(filters.dueDateTo).getTime())) {
      validated.dueDateTo = new Date(filters.dueDateTo);
    }

    return validated;
  }

  /**
   * Aplica filtros de autorización según el rol del usuario
   */
  private applyAuthorizationFilters(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
  ): GetTasksFilters {
    const authorizedFilters = { ...filters };

    // Si el usuario no es ADMIN, aplicar restricciones de autorización
    if (userRole !== "ADMIN") {
      // Si hay filtros específicos, verificar que el usuario tenga permisos
      if (filters.assignedTo && filters.assignedTo !== userId) {
        throw new Error(
          "No tienes permisos para ver tareas asignadas a otros usuarios",
        );
      }
      if (filters.createdBy && filters.createdBy !== userId) {
        throw new Error(
          "No tienes permisos para ver tareas creadas por otros usuarios",
        );
      }

      // Si no hay filtros específicos, no aplicar filtros adicionales aquí
      // La lógica de autorización se manejará en el repositorio
    }

    return authorizedFilters;
  }

  /**
   * Valida si una cadena es un UUID válido
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
