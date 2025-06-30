import type { TaskData } from "../domain";
import { Task } from "../domain";
import type { GetTasksFilters } from "../domain/ports/in/task-controller.port";
import { GetTasksResult } from "../domain/ports/in/task-controller.port";

import type { TaskRepositoryPort } from "./get-tasks.usecase";

export interface GetUserTasksRequest {
  userId: string;
  filters?: GetTasksFilters;
  page?: number;
  limit?: number;
}

export interface GetUserTasksResult {
  tasks: TaskData[];
  total: number;
  page: number;
  limit: number;
  userId: string;
}

export class GetUserTasksUseCase {
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Obtiene las tareas de un usuario específico
   * @param request - Parámetros de la petición
   * @param currentUserId - ID del usuario autenticado
   * @param currentUserRole - Rol del usuario autenticado
   * @returns Promise con las tareas del usuario
   */
  async getUserTasks(
    request: GetUserTasksRequest,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<GetUserTasksResult> {
    // Validar que el userId sea un UUID válido
    if (!this.isValidUUID(request.userId)) {
      throw new Error("ID de usuario inválido");
    }

    // Validar autorización
    this.validateAuthorization(request.userId, currentUserId, currentUserRole);

    // Normalizar parámetros de paginación
    const page = Math.max(1, request.page || 1);
    const limit = Math.min(100, Math.max(1, request.limit || 10));

    // Aplicar filtros de autorización según el rol
    const authorizedFilters = this.applyAuthorizationFilters(
      request.filters || {},
      currentUserId,
      currentUserRole,
    );

    // Validar filtros
    const validatedFilters = this.validateFilters(authorizedFilters);

    // Obtener tareas del repositorio
    const result = await this.taskRepository.findTasks(
      validatedFilters,
      currentUserId,
      currentUserRole,
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
      userId: request.userId,
    };
  }

  /**
   * Valida la autorización del usuario
   */
  private validateAuthorization(
    targetUserId: string,
    currentUserId: string,
    currentUserRole: string,
  ): void {
    // Los administradores pueden ver tareas de cualquier usuario
    if (currentUserRole === "ADMIN") {
      return;
    }

    // Los usuarios normales solo pueden ver sus propias tareas
    if (targetUserId !== currentUserId) {
      throw new Error("No tienes permisos para ver tareas de otros usuarios");
    }
  }

  /**
   * Aplica filtros de autorización según el rol del usuario
   */
  private applyAuthorizationFilters(
    filters: GetTasksFilters,
    currentUserId: string,
    currentUserRole: string,
  ): GetTasksFilters {
    const authorizedFilters = { ...filters };

    // Si el usuario no es ADMIN, aplicar restricciones de autorización
    if (currentUserRole !== "ADMIN") {
      // Los usuarios normales no pueden filtrar por otros usuarios
      if (filters.assignedTo && filters.assignedTo !== currentUserId) {
        throw new Error(
          "No tienes permisos para ver tareas asignadas a otros usuarios",
        );
      }
      if (filters.createdBy && filters.createdBy !== currentUserId) {
        throw new Error(
          "No tienes permisos para ver tareas creadas por otros usuarios",
        );
      }
    }

    return authorizedFilters;
  }

  /**
   * Valida y normaliza los filtros de entrada
   */
  private validateFilters(filters: GetTasksFilters): GetTasksFilters {
    const validated: GetTasksFilters = {};

    // Validar status
    if (
      filters.status &&
      ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(filters.status)
    ) {
      validated.status = filters.status;
    }

    // Validar priority
    if (
      filters.priority &&
      ["LOW", "MEDIUM", "HIGH"].includes(filters.priority)
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
   * Valida si una cadena es un UUID válido
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
