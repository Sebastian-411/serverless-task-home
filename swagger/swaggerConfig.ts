const swaggerJSDoc = require('swagger-jsdoc');

/**
 * Swagger configuration for the serverless API
 * Generates OpenAPI 3.0.0 specification from JSDoc comments
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Serverless Task Management API',
      version: '1.0.0',
      description: 'API REST serverless con autenticación basada en roles, gestión de tareas y usuarios usando Next.js, Prisma y Supabase',
      contact: {
        name: 'Sebastian',
        email: 'sebastian@example.com',
        url: 'https://github.com/Sebastian-411'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://your-vercel-app.vercel.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the user'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'USER', 'MANAGER'],
              description: 'User role in the system'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp'
            }
          },
          required: ['email', 'name', 'role']
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the task'
            },
            title: {
              type: 'string',
              description: 'Task title'
            },
            description: {
              type: 'string',
              description: 'Task description'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              description: 'Current status of the task'
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              description: 'Task priority level'
            },
            assignedTo: {
              type: 'string',
              description: 'User ID assigned to the task'
            },
            createdBy: {
              type: 'string',
              description: 'User ID who created the task'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task last update timestamp'
            }
          },
          required: ['title', 'description', 'status', 'priority']
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          },
          required: ['email', 'password']
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./api/**/*.ts'], // Path to the API files
};

module.exports = {
  swaggerSpec: swaggerJSDoc(options)
};