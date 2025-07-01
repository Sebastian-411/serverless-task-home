import type { GeminiService } from "../../common/config/ai/gemini.service";

import type { TaskRepositoryPort } from "./get-tasks.usecase";

/**
 * Command for getting task summary
 */
export interface GetTaskSummaryCommand {
  limit: number;
  authContext: { userId: string; role: string };
}

/**
 * Result of task summary generation
 */
export interface GetTaskSummaryResult {
  summary: string;
  taskCount: number;
  userRole: string;
}

/**
 * Use case for generating AI-powered task summaries
 * Provides role-based access to task summaries using Gemini AI
 */
export class GetTaskSummaryUseCase {
  constructor(
    private readonly taskRepository: TaskRepositoryPort,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Executes the task summary generation
   * @param command - Command containing limit and auth context
   * @returns Promise<GetTaskSummaryResult> - Generated summary with metadata
   */
  async execute(command: GetTaskSummaryCommand): Promise<GetTaskSummaryResult> {
    console.log(
      `[GetTaskSummaryUseCase] Starting summary generation for user ${command.authContext.userId} with limit ${command.limit}`,
    );

    try {
      // Validate authentication
      if (!command.authContext.userId) {
        console.error("[GetTaskSummaryUseCase] Unauthorized access attempt");
        throw new Error("Authentication required");
      }

      const { userId, role } = command.authContext;
      const limit = Math.min(Math.max(command.limit || 10, 1), 50); // Clamp between 1 and 50

      console.log(
        `[GetTaskSummaryUseCase] Fetching tasks for ${role} user ${userId} with limit ${limit}`,
      );

      // Get tasks based on user role
      let tasks;
      if (role === "admin") {
        // Admin gets all recent tasks
        tasks = await this.taskRepository.findRecentTasks(limit);
        console.log(
          `[GetTaskSummaryUseCase] Admin access: found ${tasks.length} recent tasks`,
        );
      } else {
        // User gets only their assigned tasks
        tasks = await this.taskRepository.findRecentTasksByUser(userId, limit);
        console.log(
          `[GetTaskSummaryUseCase] User access: found ${tasks.length} assigned tasks for user ${userId}`,
        );
      }

      // Extract title and description for AI processing
      const taskData = tasks.map((task) => ({
        title: task.title,
        description: task.description || "No description provided",
      }));

      console.log(
        `[GetTaskSummaryUseCase] Generating AI summary for ${taskData.length} tasks`,
      );

      // Generate AI summary
      const summary = await this.geminiService.generateTaskSummary(
        taskData,
        role as "admin" | "user",
      );

      const result: GetTaskSummaryResult = {
        summary,
        taskCount: tasks.length,
        userRole: role,
      };

      console.log(
        `[GetTaskSummaryUseCase] Successfully generated summary for ${tasks.length} tasks`,
      );
      return result;
    } catch (error) {
      console.error(
        "[GetTaskSummaryUseCase] Error generating task summary:",
        error,
      );
      throw error;
    }
  }
}
