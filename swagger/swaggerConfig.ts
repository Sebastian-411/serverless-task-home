/**
 * Swagger configuration for the serverless API
 * OpenAPI 3.0.0 specification
 */
const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Serverless Task Management API",
    version: "1.0.0",
    description:
      "API REST serverless con autenticación basada en roles, gestión de tareas y usuarios usando Next.js, Prisma y Supabase",
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
      url: "http://localhost:3000",
      description: "Development server",
    },
    {
      url: "https://your-vercel-app.vercel.app",
      description: "Production server",
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
                  },
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
        },
      },
    },
  },
};

export { swaggerSpec };
