import type { VercelRequest, VercelResponse } from "@vercel/node";

import handler from "../../../../api/tasks/summary";

// Mock the HttpTaskController
jest.mock(
  "../../../../core/task/infrastructure/adapters/in/http-task-controller",
);

const mockHttpTaskController =
  require("../../../../core/task/infrastructure/adapters/in/http-task-controller").HttpTaskController;

describe("GET /api/tasks/summary", () => {
  let mockRequest: VercelRequest;
  let mockResponse: VercelResponse;
  let mockGetTaskSummary: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the getTaskSummary method
    mockGetTaskSummary = jest.fn();

    // Mock HttpTaskController constructor and instance
    mockHttpTaskController.mockImplementation(() => ({
      getTaskSummary: mockGetTaskSummary,
    }));
  });

  it("should return AI summary for admin user", async () => {
    // Arrange
    mockGetTaskSummary.mockResolvedValue(undefined); // The method handles the response internally

    mockRequest = {
      method: "GET",
      query: { limit: "5" },
      headers: { authorization: "Bearer test-token" },
    } as unknown as VercelRequest;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as VercelResponse;

    // Act
    await handler(mockRequest, mockResponse);

    // Assert
    expect(mockGetTaskSummary).toHaveBeenCalledWith(mockRequest, mockResponse);
  });

  it("should return 405 for non-GET methods", async () => {
    // Arrange
    mockRequest = {
      method: "POST",
      query: {},
      headers: { authorization: "Bearer test-token" },
    } as unknown as VercelRequest;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as VercelResponse;

    // Act
    await handler(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(405);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Method not allowed",
      message: "Only GET method is allowed",
    });
    expect(mockGetTaskSummary).not.toHaveBeenCalled();
  });

  it("should handle controller errors", async () => {
    // Arrange
    mockGetTaskSummary.mockRejectedValue(new Error("Controller error"));

    mockRequest = {
      method: "GET",
      query: {},
      headers: { authorization: "Bearer test-token" },
    } as unknown as VercelRequest;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as VercelResponse;

    // Act
    await handler(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });

  it("should delegate to controller for valid GET requests", async () => {
    // Arrange
    mockGetTaskSummary.mockResolvedValue(undefined);

    mockRequest = {
      method: "GET",
      query: { limit: "10" },
      headers: { authorization: "Bearer test-token" },
    } as unknown as VercelRequest;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as VercelResponse;

    // Act
    await handler(mockRequest, mockResponse);

    // Assert
    expect(mockGetTaskSummary).toHaveBeenCalledWith(mockRequest, mockResponse);
  });
});
