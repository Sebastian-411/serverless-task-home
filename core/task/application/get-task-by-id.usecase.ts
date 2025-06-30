import type { Task, TaskData } from "../domain";

export interface TaskRepositoryPort {
  findTaskById(id: string): Promise<Task | null>;
}

export class GetTaskByIdUseCase {
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Obtiene una tarea específica por ID según los permisos del usuario
   * @param taskId - ID de la tarea a obtener
   * @param userId - ID del usuario autenticado
   * @param userRole - Rol del usuario autenticado
   * @returns Promise con la tarea o null si no existe/no tiene permisos
   */
  async getTaskById(
    taskId: string,
    userId: string,
    userRole: string,
  ): Promise<TaskData | null> {
    // Obtener tarea del repositorio
    const task = await this.taskRepository.findTaskById(taskId);

    if (!task) {
      return null;
    }

    // Verificar autorización
    if (!this.isAuthorized(task, userId, userRole)) {
      throw new Error("No tienes permisos para ver esta tarea");
    }

    // Convertir entidad a DTO
    return task.toJSON() as unknown as TaskData;
  }

  /**
   * Verifica si el usuario tiene permisos para ver la tarea
   */
  private isAuthorized(task: Task, userId: string, userRole: string): boolean {
    // Los administradores pueden ver cualquier tarea
    if (userRole === "ADMIN") {
      return true;
    }
    // Los usuarios normales pueden ver tareas que les fueron asignadas o que crearon
    return task.assignedTo === userId || task.createdBy === userId;
  }
}
