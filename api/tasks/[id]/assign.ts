/**
 * @openapi
 * /api/tasks/{id}/assign:
 *   post:
 *     tags:
 *       - Tasks
 *     summary: Assign task to user
 *     description: Assign a task to a specific user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID to assign the task to
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input data or task already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { HttpTaskController } from "../../../core/task/infrastructure/adapters/in/http-task-controller";

const taskController = new HttpTaskController();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    return await taskController.assignTask(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
