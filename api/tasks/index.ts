import type { VercelRequest, VercelResponse } from "@vercel/node";

import { HttpTaskController } from "../../core/task/infrastructure/adapters/in/http-task-controller";
import { authenticate } from "../../core/common/config/middlewares/auth.middleware";
import { handleError } from "../../core/common/config/middlewares/error-handler.middleware";

const taskController = new HttpTaskController();

/**
 * GET /tasks - Obtiene las tareas según los permisos del usuario
 * POST /tasks - Crea una nueva tarea (solo admin)
 *
 * Parámetros de query:
 * - status: Filtro por estado (PENDING, IN_PROGRESS, COMPLETED)
 * - priority: Filtro por prioridad (LOW, MEDIUM, HIGH)
 * - assignedTo: Filtro por usuario asignado (UUID)
 * - createdBy: Filtro por usuario creador (UUID)
 * - dueDateFrom: Filtro por fecha de vencimiento desde (ISO string)
 * - dueDateTo: Filtro por fecha de vencimiento hasta (ISO string)
 * - page: Número de página (por defecto 1)
 * - limit: Límite de elementos por página (por defecto 10, máximo 100)
 *
 * Permisos:
 * - ADMIN: Puede ver todas las tareas
 * - USER: Solo puede ver tareas asignadas y creadas por él
 * - Sin autenticación: Error 401
 * - Rol inválido: Error 403
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return await taskController.getTasks(req, res);
  }
  if (req.method === "POST") {
    return await taskController.createTask(req, res);
  }
  return res.status(405).json({ error: "Method not allowed" });
}
