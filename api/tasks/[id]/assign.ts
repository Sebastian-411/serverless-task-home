import type { VercelRequest, VercelResponse } from "@vercel/node";

import { HttpTaskController } from "../../../core/task/infrastructure/adapters/in/http-task-controller";

const taskController = new HttpTaskController();

/**
 * POST /tasks/:id/assign - Asigna una tarea a un usuario específico
 *
 * Parámetros de path:
 * - id: ID de la tarea (UUID)
 *
 * Body:
 * - userId: ID del usuario al que se asignará la tarea (UUID)
 *
 * Permisos:
 * - ADMIN: ✅ Puede asignar tareas a cualquier usuario
 * - USER: ❌ No autorizado (Error 403)
 * - Sin autenticación: ❌ Error 401
 * - Tarea no encontrada: Error 404
 * - ID inválido: Error 400
 * - Tarea completada: Error 400
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    return await taskController.assignTask(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
