import { Task, TaskData } from "../domain";

import type { TaskRepositoryPort } from "./get-tasks.usecase";

export class DeleteTaskUseCase {
  constructor(private taskRepository: TaskRepositoryPort) {}

  async deleteTask(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    // Buscar la tarea existente
    const task = await this.taskRepository.findTaskById(id);
    if (!task) {
      throw new Error("Tarea no encontrada");
    }

    // Autorización
    if (userRole !== "ADMIN" && task.createdBy !== userId) {
      throw new Error("No tienes permisos para eliminar esta tarea");
    }

    // Eliminar tarea
    await this.taskRepository.deleteTask(id);
  }
}
