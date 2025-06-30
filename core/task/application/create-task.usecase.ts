import type { Task, TaskData, TaskStatus, TaskPriority } from "../domain";

export interface CreateTaskInput {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedTo?: string;
  createdBy: string;
}

export interface TaskRepositoryPort {
  createTask(data: CreateTaskInput): Promise<Task>;
}

export class CreateTaskUseCase {
  constructor(private taskRepository: TaskRepositoryPort) {}

  /**
   * Crea una nueva tarea (admin o user)
   */
  async createTask(
    input: CreateTaskInput,
    userRole: string,
  ): Promise<TaskData> {
    // Validaciones básicas
    if (!input.title || !input.description) {
      throw new Error("Faltan campos obligatorios");
    }
    // Crear tarea
    const task = await this.taskRepository.createTask(input);
    return task.toJSON() as unknown as TaskData;
  }
}
