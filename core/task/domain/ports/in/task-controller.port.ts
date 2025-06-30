import type { TaskData, UpdateTaskData } from "../../entities/task.entity";
import { Task } from "../../entities/task.entity";

export interface GetTasksFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  createdBy?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface GetTasksResult {
  tasks: TaskData[];
  total: number;
  page: number;
  limit: number;
}

export interface TaskControllerPort {
  /**
   * Obtiene las tareas según los filtros y permisos del usuario
   * @param filters - Filtros opcionales para las tareas
   * @param userId - ID del usuario autenticado
   * @param userRole - Rol del usuario autenticado
   * @param page - Número de página (opcional, por defecto 1)
   * @param limit - Límite de elementos por página (opcional, por defecto 10)
   * @returns Promise con las tareas y metadatos de paginación
   */
  getTasks(
    filters: GetTasksFilters,
    userId: string,
    userRole: string,
    page?: number,
    limit?: number,
  ): Promise<GetTasksResult>;

  /**
   * Actualiza una tarea existente
   * @param id - ID de la tarea
   * @param data - Datos a actualizar
   * @param userId - ID del usuario autenticado
   * @param userRole - Rol del usuario autenticado
   */
  updateTask(
    id: string,
    data: Partial<UpdateTaskData>,
    userId: string,
    userRole: string,
  ): Promise<TaskData>;
}
