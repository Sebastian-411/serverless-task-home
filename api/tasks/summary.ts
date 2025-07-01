import type { VercelRequest, VercelResponse } from "@vercel/node";

import { HttpTaskController } from "../../core/task/infrastructure/adapters/in/http-task-controller";

/**
 * GET /api/tasks/summary
 * Generates an AI-powered summary of recent tasks based on user role
 *
 * Query Parameters:
 * - limit (optional): Number of recent tasks to include (default: 10, max: 50)
 *
 * Authentication: Required
 * Authorization: Role-based access
 * - Admin: Access to all recent tasks
 * - User: Access only to assigned tasks
 *
 * @param req - Vercel request object
 * @param res - Vercel response object
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[GET /api/tasks/summary] Request received");

  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only GET method is allowed",
    });
  }

  try {
    const taskController = new HttpTaskController();
    return await taskController.getTaskSummary(req, res);
  } catch (error) {
    console.error("[GET /api/tasks/summary] Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
