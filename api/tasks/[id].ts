import type { VercelRequest, VercelResponse } from "@vercel/node";

import { HttpTaskController } from "../../core/task/infrastructure/adapters/in/http-task-controller";

const taskController = new HttpTaskController();

/**
 * GET /tasks/:id - Obtiene una tarea específica por ID
 *
 * Parámetros de path:
 * - id: ID de la tarea (UUID)
 *
 * Permisos:
 * - ADMIN: Puede ver cualquier tarea
 * - USER: Solo puede ver tareas que le fueron asignadas
 * - Sin autenticación: Error 401
 * - Sin permisos: Error 403
 * - Tarea no encontrada: Error 404
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return await taskController.getTaskById(req, res);
  }

  if (req.method === "PUT") {
    return await taskController.updateTask(req, res);
  }

  if (req.method === "DELETE") {
    return await taskController.deleteTask(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
