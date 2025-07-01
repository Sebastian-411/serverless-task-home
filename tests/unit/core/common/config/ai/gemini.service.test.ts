import { GoogleGenerativeAI } from "@google/generative-ai";

import { GeminiService } from "../../../../../../core/common/config/ai/gemini.service";

// Mock GoogleGenerativeAI
jest.mock("@google/generative-ai");

describe("GeminiService", () => {
  let geminiService: GeminiService;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;
  let mockModel: any;
  let mockGenerateContent: jest.Mock;
  let mockResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variable
    process.env.GEMINI_API_KEY = "test-api-key";

    // Mock GoogleGenerativeAI
    mockGenAI = {
      getGenerativeModel: jest.fn(),
    } as any;

    mockGenerateContent = jest.fn();
    mockResponse = {
      text: jest.fn(),
    };

    mockModel = {
      generateContent: mockGenerateContent,
    };

    (
      GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>
    ).mockImplementation(() => mockGenAI);
    mockGenAI.getGenerativeModel.mockReturnValue(mockModel);
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe("constructor", () => {
    it("inicializa correctamente con API key válida", () => {
      process.env.GEMINI_API_KEY = "valid-api-key";

      expect(() => new GeminiService()).not.toThrow();

      expect(GoogleGenerativeAI).toHaveBeenCalledWith("valid-api-key");
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: "gemini-1.5-flash",
      });
    });

    it("lanza error cuando no hay API key", () => {
      delete process.env.GEMINI_API_KEY;

      expect(() => new GeminiService()).toThrow(
        "GEMINI_API_KEY environment variable is required",
      );
    });

    it("lanza error cuando API key está vacía", () => {
      process.env.GEMINI_API_KEY = "";

      expect(() => new GeminiService()).toThrow(
        "GEMINI_API_KEY environment variable is required",
      );
    });
  });

  describe("generateTaskSummary", () => {
    beforeEach(() => {
      geminiService = new GeminiService();
    });

    it("genera resumen exitosamente para admin con tareas", async () => {
      const tasks = [
        { title: "Task 1", description: "Description 1" },
        { title: "Task 2", description: "Description 2" },
      ];

      const expectedSummary = "Summary of tasks for admin";
      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue(expectedSummary);

      const result = await geminiService.generateTaskSummary(tasks, "admin");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(
          "You are an AI assistant helping an administrator",
        ),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("1. Task 1: Description 1"),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("2. Task 2: Description 2"),
      );
      expect(result).toBe(expectedSummary);
    });

    it("genera resumen exitosamente para user con tareas", async () => {
      const tasks = [
        { title: "User Task 1", description: "User Description 1" },
      ];

      const expectedSummary = "Summary of tasks for user";
      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue(expectedSummary);

      const result = await geminiService.generateTaskSummary(tasks, "user");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("You are an AI assistant helping a user"),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("1. User Task 1: User Description 1"),
      );
      expect(result).toBe(expectedSummary);
    });

    it("retorna mensaje específico para admin sin tareas", async () => {
      const tasks: Array<{ title: string; description: string }> = [];

      const result = await geminiService.generateTaskSummary(tasks, "admin");

      expect(result).toBe("No recent tasks found in the system.");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("retorna mensaje específico para user sin tareas", async () => {
      const tasks: Array<{ title: string; description: string }> = [];

      const result = await geminiService.generateTaskSummary(tasks, "user");

      expect(result).toBe("You have no recent tasks assigned to you.");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("maneja tareas con descripciones largas", async () => {
      const tasks = [
        {
          title: "Complex Task",
          description:
            "This is a very long description that contains multiple sentences and should be handled properly by the service.",
        },
      ];

      const expectedSummary = "Summary of complex task";
      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue(expectedSummary);

      const result = await geminiService.generateTaskSummary(tasks, "admin");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(
          "1. Complex Task: This is a very long description that contains multiple sentences and should be handled properly by the service.",
        ),
      );
      expect(result).toBe(expectedSummary);
    });

    it("maneja tareas con caracteres especiales", async () => {
      const tasks = [
        {
          title: "Task with special chars: áéíóú & symbols!@#$%",
          description: 'Description with ñ and special chars: <>&"',
        },
      ];

      const expectedSummary = "Summary with special chars";
      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue(expectedSummary);

      const result = await geminiService.generateTaskSummary(tasks, "admin");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(
          '1. Task with special chars: áéíóú & symbols!@#$%: Description with ñ and special chars: <>&"',
        ),
      );
      expect(result).toBe(expectedSummary);
    });

    it("maneja múltiples tareas correctamente", async () => {
      const tasks = [
        { title: "Task 1", description: "Description 1" },
        { title: "Task 2", description: "Description 2" },
        { title: "Task 3", description: "Description 3" },
        { title: "Task 4", description: "Description 4" },
        { title: "Task 5", description: "Description 5" },
      ];

      const expectedSummary = "Summary of multiple tasks";
      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue(expectedSummary);

      const result = await geminiService.generateTaskSummary(tasks, "admin");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("1. Task 1: Description 1"),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("2. Task 2: Description 2"),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("3. Task 3: Description 3"),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("4. Task 4: Description 4"),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("5. Task 5: Description 5"),
      );
      expect(result).toBe(expectedSummary);
    });

    it("maneja error de generación de contenido", async () => {
      const tasks = [{ title: "Task 1", description: "Description 1" }];

      const error = new Error("API Error");
      mockGenerateContent.mockRejectedValue(error);

      await expect(
        geminiService.generateTaskSummary(tasks, "admin"),
      ).rejects.toThrow("Failed to generate task summary");
    });

    it("maneja error de respuesta vacía", async () => {
      const tasks = [{ title: "Task 1", description: "Description 1" }];

      mockGenerateContent.mockResolvedValue({
        response: null,
      });

      await expect(
        geminiService.generateTaskSummary(tasks, "admin"),
      ).rejects.toThrow("Failed to generate task summary");
    });

    it("maneja error de método text no disponible", async () => {
      const tasks = [{ title: "Task 1", description: "Description 1" }];

      mockGenerateContent.mockResolvedValue({
        response: {},
      });

      await expect(
        geminiService.generateTaskSummary(tasks, "admin"),
      ).rejects.toThrow("Failed to generate task summary");
    });

    it("maneja error de método text que lanza excepción", async () => {
      const tasks = [{ title: "Task 1", description: "Description 1" }];

      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockImplementation(() => {
        throw new Error("Text method error");
      });

      await expect(
        geminiService.generateTaskSummary(tasks, "admin"),
      ).rejects.toThrow("Failed to generate task summary");
    });
  });

  describe("buildPrompt", () => {
    beforeEach(() => {
      geminiService = new GeminiService();
    });

    it("construye prompt correcto para admin", async () => {
      const tasks = [{ title: "Admin Task", description: "Admin Description" }];

      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue("Admin summary");

      await geminiService.generateTaskSummary(tasks, "admin");

      const promptCall = mockGenerateContent.mock.calls[0][0];

      expect(promptCall).toContain(
        "You are an AI assistant helping an administrator",
      );
      expect(promptCall).toContain("1. Admin Task: Admin Description");
      expect(promptCall).toContain("Key themes and patterns");
      expect(promptCall).toContain("Priority areas that need attention");
      expect(promptCall).toContain("Overall workload distribution");
      expect(promptCall).toContain(
        "brief, professional summary in 1-2 sentences",
      );
    });

    it("construye prompt correcto para user", async () => {
      const tasks = [{ title: "User Task", description: "User Description" }];

      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue("User summary");

      await geminiService.generateTaskSummary(tasks, "user");

      const promptCall = mockGenerateContent.mock.calls[0][0];

      expect(promptCall).toContain("You are an AI assistant helping a user");
      expect(promptCall).toContain("1. User Task: User Description");
      expect(promptCall).toContain("Key themes and patterns");
      expect(promptCall).toContain("Priority areas that need attention");
      expect(promptCall).toContain("Overall workload distribution");
      expect(promptCall).toContain(
        "brief, professional summary in 1-2 sentences",
      );
    });

    it("incluye todas las tareas en el prompt", async () => {
      const tasks = [
        { title: "Task 1", description: "Description 1" },
        { title: "Task 2", description: "Description 2" },
        { title: "Task 3", description: "Description 3" },
      ];

      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue("Summary");

      await geminiService.generateTaskSummary(tasks, "admin");

      const promptCall = mockGenerateContent.mock.calls[0][0];

      expect(promptCall).toContain("1. Task 1: Description 1");
      expect(promptCall).toContain("2. Task 2: Description 2");
      expect(promptCall).toContain("3. Task 3: Description 3");
    });

    it("formatea correctamente tareas con índices", async () => {
      const tasks = [
        { title: "First Task", description: "First Description" },
        { title: "Second Task", description: "Second Description" },
      ];

      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue("Summary");

      await geminiService.generateTaskSummary(tasks, "admin");

      const promptCall = mockGenerateContent.mock.calls[0][0];

      expect(promptCall).toContain("1. First Task: First Description");
      expect(promptCall).toContain("2. Second Task: Second Description");
    });
  });

  describe("logging", () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      geminiService = new GeminiService();
      consoleSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("registra log cuando inicia generación de resumen", async () => {
      const tasks = [{ title: "Task 1", description: "Description 1" }];

      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue("Summary");

      await geminiService.generateTaskSummary(tasks, "admin");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[GeminiService] Generating summary for 1 tasks for admin role",
      );
    });

    it("registra log cuando completa generación exitosamente", async () => {
      const tasks = [{ title: "Task 1", description: "Description 1" }];

      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue("Summary");

      await geminiService.generateTaskSummary(tasks, "admin");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[GeminiService] Successfully generated summary for 1 tasks",
      );
    });

    it("registra log para múltiples tareas", async () => {
      const tasks = [
        { title: "Task 1", description: "Description 1" },
        { title: "Task 2", description: "Description 2" },
        { title: "Task 3", description: "Description 3" },
      ];

      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue("Summary");

      await geminiService.generateTaskSummary(tasks, "user");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[GeminiService] Generating summary for 3 tasks for user role",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "[GeminiService] Successfully generated summary for 3 tasks",
      );
    });
  });

  describe("error logging", () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      geminiService = new GeminiService();
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("registra error cuando falla la generación", async () => {
      const tasks = [{ title: "Task 1", description: "Description 1" }];

      const error = new Error("API Error");
      mockGenerateContent.mockRejectedValue(error);

      await expect(
        geminiService.generateTaskSummary(tasks, "admin"),
      ).rejects.toThrow("Failed to generate task summary");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[GeminiService] Error generating task summary:",
        error,
      );
    });

    it("registra error cuando falla el método text", async () => {
      const tasks = [{ title: "Task 1", description: "Description 1" }];

      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockImplementation(() => {
        throw new Error("Text method error");
      });

      await expect(
        geminiService.generateTaskSummary(tasks, "admin"),
      ).rejects.toThrow("Failed to generate task summary");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[GeminiService] Error generating task summary:",
        expect.any(Error),
      );
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      geminiService = new GeminiService();
    });

    it("maneja tareas con títulos vacíos", async () => {
      const tasks = [
        { title: "", description: "Description 1" },
        { title: "Task 2", description: "" },
        { title: "", description: "" },
      ];

      const expectedSummary = "Summary of tasks with empty fields";
      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue(expectedSummary);

      const result = await geminiService.generateTaskSummary(tasks, "admin");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("1. : Description 1"),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("2. Task 2: "),
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining("3. : "),
      );
      expect(result).toBe(expectedSummary);
    });

    it("maneja tareas con descripciones muy largas", async () => {
      const longDescription = "A".repeat(1000);
      const tasks = [{ title: "Long Task", description: longDescription }];

      const expectedSummary = "Summary of long task";
      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue(expectedSummary);

      const result = await geminiService.generateTaskSummary(tasks, "admin");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(`1. Long Task: ${longDescription}`),
      );
      expect(result).toBe(expectedSummary);
    });

    it("maneja tareas con caracteres de nueva línea", async () => {
      const tasks = [
        {
          title: "Task with\nnewlines",
          description: "Description\nwith\nmultiple\nlines",
        },
      ];

      const expectedSummary = "Summary of task with newlines";
      mockGenerateContent.mockResolvedValue({
        response: mockResponse,
      });
      mockResponse.text.mockReturnValue(expectedSummary);

      const result = await geminiService.generateTaskSummary(tasks, "admin");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(
          "1. Task with\nnewlines: Description\nwith\nmultiple\nlines",
        ),
      );
      expect(result).toBe(expectedSummary);
    });
  });
});
