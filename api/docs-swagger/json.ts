import type { VercelRequest, VercelResponse } from "@vercel/node";

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Serverless Task Management API",
    version: "1.0.0",
    description: `API REST serverless con autenticación basada en roles, gestión de tareas y usuarios usando Next.js, Prisma y Supabase ${process.env.SUPABASE_URL}`,
    contact: {
      name: "Sebastian",
      email: "sebastian@example.com",
      url: "https://github.com/Sebastian-411",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
      description: process.env.VERCEL_URL
        ? "Production server"
        : "Development server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtained from /api/auth/login",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Unique identifier for the user",
          },
          email: {
            type: "string",
            format: "email",
            description: "User email address",
          },
          name: {
            type: "string",
            description: "User full name",
          },
          role: {
            type: "string",
            enum: ["ADMIN", "USER", "MANAGER"],
            description: "User role in the system",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "User creation timestamp",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "User last update timestamp",
          },
        },
        required: ["email", "name", "role"],
      },
      Task: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Unique identifier for the task",
          },
          title: {
            type: "string",
            description: "Task title",
          },
          description: {
            type: "string",
            description: "Task description",
          },
          status: {
            type: "string",
            enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            description: "Current status of the task",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            description: "Task priority level",
          },
          assignedTo: {
            type: "string",
            description: "User ID assigned to the task",
          },
          createdBy: {
            type: "string",
            description: "User ID who created the task",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Task creation timestamp",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Task last update timestamp",
          },
        },
        required: ["title", "description", "status", "priority"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "User email address",
          },
          password: {
            type: "string",
            description: "User password",
          },
        },
        required: ["email", "password"],
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "JWT authentication token",
          },
          user: {
            $ref: "#/components/schemas/User",
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Error type",
          },
          message: {
            type: "string",
            description: "Error message",
          },
          details: {
            type: "object",
            description: "Additional error details",
          },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "User login",
        description: "Authenticate user with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "401": {
            description: "Authentication failed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users",
        description: "Retrieve a list of all users in the system",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "page",
            schema: {
              type: "integer",
              minimum: 1,
              default: 1,
            },
            description: "Page number for pagination",
          },
          {
            in: "query",
            name: "limit",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 10,
            },
            description: "Number of users per page",
          },
        ],
        responses: {
          "200": {
            description: "List of users retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/User",
                      },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "403": {
            description: "Insufficient permissions",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create a new user",
        description: "Create a new user in the system",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    description: "User email address",
                  },
                  name: {
                    type: "string",
                    description: "User full name",
                  },
                  password: {
                    type: "string",
                    minLength: 6,
                    description: "User password",
                  },
                  role: {
                    type: "string",
                    enum: ["ADMIN", "USER", "MANAGER"],
                    default: "USER",
                    description: "User role",
                  },
                },
                required: ["email", "name", "password"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          "400": {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "403": {
            description: "Insufficient permissions",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        description: "Retrieve a specific user by their ID",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description: "User ID",
          },
        ],
        responses: {
          "200": {
            description: "User retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update user",
        description: "Update an existing user's information",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description: "User ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                  },
                  name: {
                    type: "string",
                  },
                  role: {
                    type: "string",
                    enum: ["ADMIN", "USER", "MANAGER"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        description: "Delete a user from the system",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description: "User ID",
          },
        ],
        responses: {
          "204": {
            description: "User deleted successfully",
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{id}/role": {
      patch: {
        tags: ["Users"],
        summary: "Change user role",
        description: "Change the role of a specific user",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description: "User ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    enum: ["ADMIN", "USER", "MANAGER"],
                    description: "New role for the user",
                  },
                },
                required: ["role"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User role changed successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          "400": {
            description: "Invalid role",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{id}/tasks": {
      get: {
        tags: ["Users"],
        summary: "Get user tasks",
        description: "Retrieve all tasks assigned to a specific user",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description: "User ID",
          },
        ],
        responses: {
          "200": {
            description: "User tasks retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tasks: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Task",
                      },
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "Get all tasks",
        description: "Retrieve a list of tasks based on user permissions",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: {
              type: "string",
              enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            },
            description: "Filter tasks by status",
          },
          {
            in: "query",
            name: "priority",
            schema: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            },
            description: "Filter tasks by priority",
          },
        ],
        responses: {
          "200": {
            description: "List of tasks retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tasks: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Task",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Tasks"],
        summary: "Create a new task",
        description: "Create a new task in the system (Admin only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    minLength: 1,
                    maxLength: 255,
                    description: "Task title",
                  },
                  description: {
                    type: "string",
                    description: "Task description",
                  },
                  status: {
                    type: "string",
                    enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
                    default: "PENDING",
                    description: "Task status",
                  },
                  priority: {
                    type: "string",
                    enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                    default: "MEDIUM",
                    description: "Task priority",
                  },
                },
                required: ["title", "description"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Task created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Task",
                },
              },
            },
          },
          "400": {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "403": {
            description: "Insufficient permissions",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/tasks/{id}": {
      get: {
        tags: ["Tasks"],
        summary: "Get task by ID",
        description: "Retrieve a specific task by its ID",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description: "Task ID",
          },
        ],
        responses: {
          "200": {
            description: "Task retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Task",
                },
              },
            },
          },
          "404": {
            description: "Task not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Tasks"],
        summary: "Update task",
        description: "Update an existing task",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description: "Task ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    minLength: 1,
                    maxLength: 255,
                  },
                  description: {
                    type: "string",
                  },
                  status: {
                    type: "string",
                    enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
                  },
                  priority: {
                    type: "string",
                    enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Task updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Task",
                },
              },
            },
          },
          "404": {
            description: "Task not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete task",
        description: "Delete a task from the system",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description: "Task ID",
          },
        ],
        responses: {
          "204": {
            description: "Task deleted successfully",
          },
          "404": {
            description: "Task not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/tasks/{id}/assign": {
      patch: {
        tags: ["Tasks"],
        summary: "Assign task to user",
        description: "Assign a task to a specific user",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description: "Task ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    description: "User ID to assign the task to",
                  },
                },
                required: ["userId"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Task assigned successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Task",
                },
              },
            },
          },
          "400": {
            description: "Invalid user ID",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "404": {
            description: "Task or user not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/tasks/summary": {
      get: {
        tags: ["Tasks"],
        summary: "Get AI-powered task summary",
        description:
          "Generate an AI-powered summary of recent tasks based on user role. Admins get summaries of all recent tasks, while users get summaries of only their assigned tasks.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "limit",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 50,
              default: 10,
            },
            description:
              "Number of recent tasks to include in the summary (max 50)",
          },
        ],
        responses: {
          "200": {
            description: "AI-generated summary retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    summary: {
                      type: "string",
                      description:
                        "AI-generated natural language summary of tasks",
                      example:
                        "Recent tasks include improving login flow, updating UI, and setting up CI/CD pipelines.",
                    },
                    taskCount: {
                      type: "integer",
                      description: "Number of tasks included in the summary",
                      example: 5,
                    },
                    userRole: {
                      type: "string",
                      description: "Role of the user requesting the summary",
                      example: "admin",
                    },
                    limit: {
                      type: "integer",
                      description: "Limit parameter used for the request",
                      example: 10,
                    },
                  },
                  required: ["summary", "taskCount", "userRole", "limit"],
                },
              },
            },
          },
          "400": {
            description: "Invalid limit parameter",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
  },
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(swaggerSpec);
}
