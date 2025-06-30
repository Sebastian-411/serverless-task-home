import type { Task } from "../domain";

import type { TaskRepositoryPort } from "./get-tasks.usecase";

export interface AssignTaskRequest {
  userId: string; // ID del usuario al que se asignará la tarea
}

export interface AssignTaskResult {
  task: Task;
  message: string;
}

export class AssignTaskUseCase {
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Asigna una tarea a un usuario específico
   * @param taskId - ID de la tarea a asignar
   * @param assignToUserId - ID del usuario al que se asignará la tarea
   * @param currentUserId - ID del usuario que realiza la asignación
   * @param currentUserRole - Rol del usuario que realiza la asignación
   * @returns Promise con la tarea actualizada
   */
  async assignTask(
    taskId: string,
    assignToUserId: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<AssignTaskResult> {
    // Validar que solo los administradores puedan asignar tareas
    if (currentUserRole !== "ADMIN") {
      throw new Error("Solo los administradores pueden asignar tareas");
    }

    // Validar que el taskId sea un UUID válido
    if (!this.isValidUUID(taskId)) {
      throw new Error("ID de tarea inválido");
    }

    // Validar que el assignToUserId sea un UUID válido
    if (!this.isValidUUID(assignToUserId)) {
      throw new Error("ID de usuario inválido");
    }

    // Buscar la tarea
    const task = await this.taskRepository.findTaskById(taskId);
    if (!task) {
      throw new Error("Tarea no encontrada");
    }

    // Verificar que la tarea pueda ser asignada
    if (!task.canBeAssignedTo(assignToUserId)) {
      throw new Error(
        "La tarea no puede ser asignada (posiblemente ya está completada)",
      );
    }

    // Asignar la tarea
    task.assignTo(assignToUserId);

    // Guardar los cambios en el repositorio
    const updatedTask = await this.taskRepository.updateTask(taskId, {
      assignedTo: assignToUserId,
    });

    return {
      task: updatedTask,
      message: `Tarea "${task.title}" asignada exitosamente al usuario ${assignToUserId}`,
    };
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
