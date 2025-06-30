import type { VercelRequest, VercelResponse } from "@vercel/node";

import { HttpTaskController } from "../../../core/task/infrastructure/adapters/in/http-task-controller";

const taskController = new HttpTaskController();

/**
 * GET /users/:id/tasks - Obtiene las tareas de un usuario específico
 *
 * Parámetros de path:
 * - id: ID del usuario (UUID)
 *
 * Query parameters:
 * - status: Filtrar por estado (PENDING, IN_PROGRESS, COMPLETED)
 * - priority: Filtrar por prioridad (LOW, MEDIUM, HIGH)
 * - assignedTo: Filtrar por usuario asignado (UUID)
 * - createdBy: Filtrar por usuario creador (UUID)
 * - dueDateFrom: Filtrar por fecha de vencimiento desde (ISO string)
 * - dueDateTo: Filtrar por fecha de vencimiento hasta (ISO string)
 * - page: Número de página (default: 1)
 * - limit: Límite de resultados por página (default: 10, max: 100)
 *
 * Permisos:
 * - ADMIN: ✅ Puede ver tareas de cualquier usuario
 * - USER: ✅ Solo puede ver sus propias tareas (si consulta su propio ID)
 * - Sin autenticación: ❌ Error 401
 * - ID inválido: Error 400
 * - Usuario no encontrado: Error 404
 * - Sin permisos: Error 403
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return await taskController.getUserTasks(req, res);
  }

  // Método no permitido
  res.setHeader("Allow", ["GET"]);
  res.status(405).json({ error: "Método no permitido" });
}
