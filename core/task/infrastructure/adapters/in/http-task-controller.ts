import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  GetTasksUseCase,
  GetTaskByIdUseCase,
  CreateTaskUseCase,
  UpdateTaskUseCase,
  DeleteTaskUseCase,
  AssignTaskUseCase,
  GetUserTasksUseCase,
} from "../../../application";
import type { GetTasksFilters } from "../../../domain/ports/in/task-controller.port";
import { TaskRepositoryPrisma } from "../../../infrastructure/task.repository.prisma";
import { PrismaClient } from "../../../../../lib/generated/prisma";
import { authenticate } from "../../../../common/config/middlewares/auth.middleware";

export class HttpTaskController {
  private getTasksUseCase: GetTasksUseCase;
  private getTaskByIdUseCase: GetTaskByIdUseCase;
  private createTaskUseCase: CreateTaskUseCase;
  private updateTaskUseCase: UpdateTaskUseCase;
  private deleteTaskUseCase: DeleteTaskUseCase;
  private assignTaskUseCase: AssignTaskUseCase;
  private getUserTasksUseCase: GetUserTasksUseCase;

  constructor() {
    console.log("[HttpTaskController] Inicializando controlador de tareas");
    const prisma = new PrismaClient();
    const taskRepository = new TaskRepositoryPrisma(prisma);
    this.getTasksUseCase = new GetTasksUseCase(taskRepository);
    this.getTaskByIdUseCase = new GetTaskByIdUseCase(taskRepository);
    this.createTaskUseCase = new CreateTaskUseCase(taskRepository);
    this.updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
    this.deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
    this.assignTaskUseCase = new AssignTaskUseCase(taskRepository);
    this.getUserTasksUseCase = new GetUserTasksUseCase(taskRepository);
    console.log(
      "[HttpTaskController] Controlador de tareas inicializado correctamente",
    );
  }

  /**
   * Maneja la petición GET /tasks/:id
   */
  async getTaskById(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const taskId = req.query.id as string;
    console.log(
      `[HttpTaskController:${requestId}] Iniciando petición GET /tasks/${taskId}`,
    );

    try {
      // Obtener información del usuario autenticado desde el middleware
      console.log(`[HttpTaskController:${requestId}] Autenticando usuario...`);
      const authContext = await authenticate(req, res);

      // Verificar autenticación
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn(
          `[HttpTaskController:${requestId}] Usuario no autenticado`,
        );
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      console.log(
        `[HttpTaskController:${requestId}] Usuario autenticado - ID: ${authContext.user.id}, Role: ${authContext.user.role}`,
      );

      // Ejecutar caso de uso
      console.log(
        `[HttpTaskController:${requestId}] Ejecutando caso de uso getTaskById...`,
      );
      const task = await this.getTaskByIdUseCase.getTaskById(
        taskId,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );

      if (!task) {
        console.log(
          `[HttpTaskController:${requestId}] Tarea no encontrada: ${taskId}`,
        );
        res.status(404).json({ error: "Tarea no encontrada" });
        return;
      }

      console.log(
        `[HttpTaskController:${requestId}] Tarea encontrada: ${taskId}`,
      );
      res.status(200).json({ data: task });
    } catch (error) {
      console.error(
        `[HttpTaskController:${requestId}] Error en getTaskById:`,
        error,
      );

      if (error instanceof Error) {
        // Errores de autorización
        if (error.message.includes("No tienes permisos")) {
          console.warn(
            `[HttpTaskController:${requestId}] Error de autorización: ${error.message}`,
          );
          res.status(403).json({ error: error.message });
          return;
        }
      }

      // Error interno del servidor
      console.error(
        `[HttpTaskController:${requestId}] Error interno del servidor:`,
        error,
      );
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  /**
   * Maneja la petición GET /tasks
   */
  async getTasks(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(
      `[HttpTaskController:${requestId}] Iniciando petición GET /tasks`,
    );

    try {
      // Obtener información del usuario autenticado desde el middleware
      console.log(`[HttpTaskController:${requestId}] Autenticando usuario...`);
      const authContext = await authenticate(req, res);

      // Verificar autenticación
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn(
          `[HttpTaskController:${requestId}] Usuario no autenticado`,
        );
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      console.log(
        `[HttpTaskController:${requestId}] Usuario autenticado - ID: ${authContext.user.id}, Role: ${authContext.user.role}`,
      );

      // Obtener filtros de la query string
      const filters: GetTasksFilters = {};

      if (req.query.status) {
        filters.status = req.query.status as string;
        console.log(
          `[HttpTaskController:${requestId}] Filtro status: ${filters.status}`,
        );
      }

      if (req.query.priority) {
        filters.priority = req.query.priority as string;
        console.log(
          `[HttpTaskController:${requestId}] Filtro priority: ${filters.priority}`,
        );
      }

      if (req.query.assignedTo) {
        filters.assignedTo = req.query.assignedTo as string;
        console.log(
          `[HttpTaskController:${requestId}] Filtro assignedTo: ${filters.assignedTo}`,
        );
      }

      if (req.query.createdBy) {
        filters.createdBy = req.query.createdBy as string;
        console.log(
          `[HttpTaskController:${requestId}] Filtro createdBy: ${filters.createdBy}`,
        );
      }

      if (req.query.dueDateFrom) {
        const dueDateFrom = req.query.dueDateFrom as string;
        filters.dueDateFrom = new Date(dueDateFrom);
        console.log(
          `[HttpTaskController:${requestId}] Filtro dueDateFrom: ${filters.dueDateFrom}`,
        );
      }

      if (req.query.dueDateTo) {
        const dueDateTo = req.query.dueDateTo as string;
        filters.dueDateTo = new Date(dueDateTo);
        console.log(
          `[HttpTaskController:${requestId}] Filtro dueDateTo: ${filters.dueDateTo}`,
        );
      }

      // Obtener parámetros de paginación
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      console.log(
        `[HttpTaskController:${requestId}] Paginación - page: ${page}, limit: ${limit}`,
      );

      // Ejecutar caso de uso
      console.log(
        `[HttpTaskController:${requestId}] Ejecutando caso de uso getTasks...`,
      );
      const result = await this.getTasksUseCase.getTasks(
        filters,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
        page,
        limit,
      );
      console.log(
        `[HttpTaskController:${requestId}] Caso de uso completado - Tareas encontradas: ${result.tasks.length}, Total: ${result.total}`,
      );

      // Construir respuesta con metadatos de paginación
      const response = {
        data: result.tasks,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
          hasNext: result.page < Math.ceil(result.total / result.limit),
          hasPrev: result.page > 1,
        },
      };

      console.log(
        `[HttpTaskController:${requestId}] Respuesta construida - Status: 200, TotalPages: ${response.pagination.totalPages}`,
      );
      res.status(200).json(response);
    } catch (error) {
      console.error(
        `[HttpTaskController:${requestId}] Error en getTasks:`,
        error,
      );

      if (error instanceof Error) {
        // Errores de autorización
        if (error.message.includes("No tienes permisos")) {
          console.warn(
            `[HttpTaskController:${requestId}] Error de autorización: ${error.message}`,
          );
          res.status(403).json({ error: error.message });
          return;
        }

        // Errores de validación
        if (
          error.message.includes("validation") ||
          error.message.includes("invalid")
        ) {
          console.warn(
            `[HttpTaskController:${requestId}] Error de validación: ${error.message}`,
          );
          res.status(400).json({ error: error.message });
          return;
        }
      }

      // Error interno del servidor
      console.error(
        `[HttpTaskController:${requestId}] Error interno del servidor:`,
        error,
      );
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  /**
   * Maneja la petición POST /tasks
   */
  async createTask(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(
      `[HttpTaskController:${requestId}] Iniciando petición POST /tasks`,
    );
    try {
      // Autenticación
      const authContext = await authenticate(req, res);
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn(
          `[HttpTaskController:${requestId}] Usuario no autenticado`,
        );
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }
      // Crear tarea (permitido para admin y user)
      const { title, description, status, priority, dueDate, assignedTo } =
        req.body;
      const input = {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedTo,
        createdBy: authContext.user.id, // SIEMPRE el usuario autenticado
      };
      const task = await this.createTaskUseCase.createTask(
        input,
        authContext.user.role.toUpperCase(),
      );
      res.status(201).json({ data: task });
    } catch (error) {
      console.error(
        `[HttpTaskController:${requestId}] Error en createTask:`,
        error,
      );
      if (error instanceof Error) {
        if (error.message.includes("Faltan campos")) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  /**
   * Maneja la petición PUT /tasks/:id
   */
  async updateTask(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const taskId = req.query.id as string;
    console.log(
      `[HttpTaskController:${requestId}] Iniciando petición PUT /tasks/${taskId}`,
    );
    try {
      const authContext = await authenticate(req, res);
      if (!authContext.isAuthenticated || !authContext.user) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }
      const data = req.body;
      const updated = await this.updateTaskUseCase.updateTask(
        taskId,
        data,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );
      res.status(200).json({ data: updated });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("No tienes permisos")) {
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message.includes("Tarea no encontrada")) {
          res.status(404).json({ error: error.message });
          return;
        }
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  /**
   * Maneja la petición DELETE /tasks/:id
   */
  async deleteTask(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const taskId = req.query.id as string;
    console.log(
      `[HttpTaskController:${requestId}] Iniciando petición DELETE /tasks/${taskId}`,
    );

    try {
      const authContext = await authenticate(req, res);
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn(
          `[HttpTaskController:${requestId}] Usuario no autenticado`,
        );
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      console.log(
        `[HttpTaskController:${requestId}] Usuario autenticado - ID: ${authContext.user.id}, Role: ${authContext.user.role}`,
      );

      await this.deleteTaskUseCase.deleteTask(
        taskId,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );

      console.log(
        `[HttpTaskController:${requestId}] Tarea eliminada exitosamente: ${taskId}`,
      );
      res.status(204).end();
    } catch (error) {
      console.error(
        `[HttpTaskController:${requestId}] Error en deleteTask:`,
        error,
      );

      if (error instanceof Error) {
        if (error.message.includes("No tienes permisos")) {
          console.warn(
            `[HttpTaskController:${requestId}] Error de autorización: ${error.message}`,
          );
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message.includes("Tarea no encontrada")) {
          console.warn(
            `[HttpTaskController:${requestId}] Tarea no encontrada: ${error.message}`,
          );
          res.status(404).json({ error: error.message });
          return;
        }
      }

      console.error(
        `[HttpTaskController:${requestId}] Error interno del servidor:`,
        error,
      );
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  /**
   * Maneja la petición POST /tasks/:id/assign
   */
  async assignTask(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const taskId = req.query.id as string;
    console.log(
      `[HttpTaskController:${requestId}] Iniciando petición POST /tasks/${taskId}/assign`,
    );

    try {
      // Obtener información del usuario autenticado desde el middleware
      console.log(`[HttpTaskController:${requestId}] Autenticando usuario...`);
      const authContext = await authenticate(req, res);

      // Verificar autenticación
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn(
          `[HttpTaskController:${requestId}] Usuario no autenticado`,
        );
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      console.log(
        `[HttpTaskController:${requestId}] Usuario autenticado - ID: ${authContext.user.id}, Role: ${authContext.user.role}`,
      );

      // Obtener el ID del usuario al que se asignará la tarea
      const { userId } = req.body;

      if (!userId) {
        console.warn(
          `[HttpTaskController:${requestId}] Falta el campo userId en el body`,
        );
        res.status(400).json({ error: "El campo userId es requerido" });
        return;
      }

      console.log(
        `[HttpTaskController:${requestId}] Asignando tarea ${taskId} al usuario ${userId}`,
      );

      // Ejecutar caso de uso
      console.log(
        `[HttpTaskController:${requestId}] Ejecutando caso de uso assignTask...`,
      );
      const result = await this.assignTaskUseCase.assignTask(
        taskId,
        userId,
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );

      console.log(
        `[HttpTaskController:${requestId}] Tarea asignada exitosamente`,
      );
      res.status(200).json({
        data: result.task,
        message: result.message,
      });
    } catch (error) {
      console.error(
        `[HttpTaskController:${requestId}] Error en assignTask:`,
        error,
      );

      if (error instanceof Error) {
        // Errores de autorización
        if (
          error.message.includes(
            "Solo los administradores pueden asignar tareas",
          )
        ) {
          console.warn(
            `[HttpTaskController:${requestId}] Error de autorización: ${error.message}`,
          );
          res.status(403).json({ error: error.message });
          return;
        }

        // Errores de validación
        if (
          error.message.includes("ID de tarea inválido") ||
          error.message.includes("ID de usuario inválido") ||
          error.message.includes("El campo userId es requerido")
        ) {
          console.warn(
            `[HttpTaskController:${requestId}] Error de validación: ${error.message}`,
          );
          res.status(400).json({ error: error.message });
          return;
        }

        // Tarea no encontrada
        if (error.message.includes("Tarea no encontrada")) {
          console.warn(
            `[HttpTaskController:${requestId}] Tarea no encontrada: ${error.message}`,
          );
          res.status(404).json({ error: error.message });
          return;
        }

        // Error de lógica de negocio
        if (error.message.includes("no puede ser asignada")) {
          console.warn(
            `[HttpTaskController:${requestId}] Error de lógica de negocio: ${error.message}`,
          );
          res.status(400).json({ error: error.message });
          return;
        }
      }

      // Error interno del servidor
      console.error(
        `[HttpTaskController:${requestId}] Error interno del servidor:`,
        error,
      );
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  /**
   * Maneja la petición GET /users/:id/tasks
   */
  async getUserTasks(req: VercelRequest, res: VercelResponse): Promise<void> {
    const requestId = Math.random().toString(36).substring(7);
    const userId = req.query.id as string;
    console.log(
      `[HttpTaskController:${requestId}] Iniciando petición GET /users/${userId}/tasks`,
    );

    try {
      // Obtener información del usuario autenticado desde el middleware
      console.log(`[HttpTaskController:${requestId}] Autenticando usuario...`);
      const authContext = await authenticate(req, res);

      // Verificar autenticación
      if (!authContext.isAuthenticated || !authContext.user) {
        console.warn(
          `[HttpTaskController:${requestId}] Usuario no autenticado`,
        );
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      console.log(
        `[HttpTaskController:${requestId}] Usuario autenticado - ID: ${authContext.user.id}, Role: ${authContext.user.role}`,
      );

      // Obtener filtros de la query string
      const filters: GetTasksFilters = {};

      if (req.query.status) {
        filters.status = req.query.status as string;
        console.log(
          `[HttpTaskController:${requestId}] Filtro status: ${filters.status}`,
        );
      }

      if (req.query.priority) {
        filters.priority = req.query.priority as string;
        console.log(
          `[HttpTaskController:${requestId}] Filtro priority: ${filters.priority}`,
        );
      }

      if (req.query.assignedTo) {
        filters.assignedTo = req.query.assignedTo as string;
        console.log(
          `[HttpTaskController:${requestId}] Filtro assignedTo: ${filters.assignedTo}`,
        );
      }

      if (req.query.createdBy) {
        filters.createdBy = req.query.createdBy as string;
        console.log(
          `[HttpTaskController:${requestId}] Filtro createdBy: ${filters.createdBy}`,
        );
      }

      if (req.query.dueDateFrom) {
        const dueDateFrom = req.query.dueDateFrom as string;
        filters.dueDateFrom = new Date(dueDateFrom);
        console.log(
          `[HttpTaskController:${requestId}] Filtro dueDateFrom: ${filters.dueDateFrom}`,
        );
      }

      if (req.query.dueDateTo) {
        const dueDateTo = req.query.dueDateTo as string;
        filters.dueDateTo = new Date(dueDateTo);
        console.log(
          `[HttpTaskController:${requestId}] Filtro dueDateTo: ${filters.dueDateTo}`,
        );
      }

      // Obtener parámetros de paginación
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      console.log(
        `[HttpTaskController:${requestId}] Paginación - page: ${page}, limit: ${limit}`,
      );

      // Ejecutar caso de uso
      console.log(
        `[HttpTaskController:${requestId}] Ejecutando caso de uso getUserTasks...`,
      );
      const result = await this.getUserTasksUseCase.getUserTasks(
        {
          userId,
          filters,
          page,
          limit,
        },
        authContext.user.id,
        authContext.user.role.toUpperCase(),
      );

      console.log(
        `[HttpTaskController:${requestId}] Caso de uso completado - Tareas encontradas: ${result.tasks.length}, Total: ${result.total}`,
      );

      // Construir respuesta con metadatos de paginación
      const response = {
        data: result.tasks,
        userId: result.userId,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
          hasNext: result.page < Math.ceil(result.total / result.limit),
          hasPrev: result.page > 1,
        },
      };

      console.log(
        `[HttpTaskController:${requestId}] Respuesta construida - Status: 200, TotalPages: ${response.pagination.totalPages}`,
      );
      res.status(200).json(response);
    } catch (error) {
      console.error(
        `[HttpTaskController:${requestId}] Error en getUserTasks:`,
        error,
      );

      if (error instanceof Error) {
        // Errores de autorización
        if (error.message.includes("No tienes permisos")) {
          console.warn(
            `[HttpTaskController:${requestId}] Error de autorización: ${error.message}`,
          );
          res.status(403).json({ error: error.message });
          return;
        }

        // Errores de validación
        if (error.message.includes("ID de usuario inválido")) {
          console.warn(
            `[HttpTaskController:${requestId}] Error de validación: ${error.message}`,
          );
          res.status(400).json({ error: error.message });
          return;
        }

        // Usuario no encontrado
        if (error.message.includes("Usuario no encontrado")) {
          console.warn(
            `[HttpTaskController:${requestId}] Usuario no encontrado: ${error.message}`,
          );
          res.status(404).json({ error: error.message });
          return;
        }
      }

      // Error interno del servidor
      console.error(
        `[HttpTaskController:${requestId}] Error interno del servidor:`,
        error,
      );
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}
