import type { UpdateTaskData, TaskData } from "../domain";
import { Task } from "../domain";

import type { TaskRepositoryPort } from "./get-tasks.usecase";

export class UpdateTaskUseCase {
  constructor(private taskRepository: TaskRepositoryPort) {}

  async updateTask(
    id: string,
    data: Partial<UpdateTaskData>,
    userId: string,
    userRole: string,
  ): Promise<TaskData> {
    // Buscar la tarea existente
    const task = await this.taskRepository.findTaskById(id);
    if (!task) {
      throw new Error("Tarea no encontrada");
    }
    // Autorización
    if (
      userRole !== "ADMIN" &&
      task.createdBy !== userId &&
      task.assignedTo !== userId
    ) {
      throw new Error("No tienes permisos para actualizar esta tarea");
    }
    // Actualizar datos
    task.updateDetails(data);
    task.validate();
    // Guardar en repositorio
    const updated = await this.taskRepository.updateTask(id, data);
    return updated.toJSON() as unknown as TaskData;
  }
}
