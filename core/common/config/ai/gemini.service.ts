import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Service for interacting with Google's Gemini AI API
 * Handles task summarization using natural language processing
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Generates a natural language summary of tasks
   * @param tasks - Array of tasks with title and description
   * @param userRole - Role of the user requesting the summary
   * @returns Promise<string> - Generated summary
   */
  async generateTaskSummary(
    tasks: Array<{ title: string; description: string }>,
    userRole: "admin" | "user",
  ): Promise<string> {
    try {
      console.log(
        `[GeminiService] Generating summary for ${tasks.length} tasks for ${userRole} role`,
      );

      if (tasks.length === 0) {
        return userRole === "admin"
          ? "No recent tasks found in the system."
          : "You have no recent tasks assigned to you.";
      }

      const taskList = tasks
        .map(
          (task, index) => `${index + 1}. ${task.title}: ${task.description}`,
        )
        .join("\n");

      const prompt = this.buildPrompt(taskList, userRole);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      console.log(
        `[GeminiService] Successfully generated summary for ${tasks.length} tasks`,
      );
      return summary;
    } catch (error) {
      console.error("[GeminiService] Error generating task summary:", error);
      throw new Error("Failed to generate task summary");
    }
  }

  /**
   * Builds the prompt for Gemini AI based on user role and tasks
   * @param taskList - Formatted list of tasks
   * @param userRole - Role of the user
   * @returns string - Formatted prompt for AI
   */
  private buildPrompt(taskList: string, userRole: "admin" | "user"): string {
    const roleContext =
      userRole === "admin"
        ? "You are an AI assistant helping an administrator understand recent activity across all tasks in the system."
        : "You are an AI assistant helping a user understand their recent assigned tasks.";

    return `${roleContext}

Please provide a concise, natural language summary of the following tasks. Focus on:
- Key themes and patterns
- Priority areas that need attention
- Overall workload distribution

Tasks:
${taskList}

Please provide a brief, professional summary in 1-2 sentences that captures the main points.`;
  }
}
