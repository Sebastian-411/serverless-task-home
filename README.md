# **Serverless Task Home API**

RESTful API for user management, built using **hexagonal architecture**, deployed with Vercel Functions. Designed to be portable between environments, easy to test, and easy to maintain.

[![Tests](https://img.shields.io/badge/tests-842%20passing-brightgreen)](https://github.com/Sebastian-411/serverless-task-home)
[![Coverage](https://img.shields.io/badge/coverage-93.6%25-brightgreen)](https://github.com/Sebastian-411/serverless-task-home)
[![Architecture](https://img.shields.io/badge/architecture-hexagonal-blue)](https://github.com/Sebastian-411/serverless-task-home)
[![Deployment](https://img.shields.io/badge/deployment-vercel-black)](https://vercel.com)

## 🧭 Introduction

User management system with role-based authentication, following principles from **Clean Architecture** and **Domain-Driven Design**. This project shows how to build serverless APIs that are scalable and maintainable, with clear separation of responsibilities and high test coverage.

**Project status**: ✅ **Ready for production** with 93.6% code coverage and 842 passing tests.

## 🏗️ Architecture and Principles

### Project Structure

```
serverless-task-home/
├── api/                    # Vercel Functions endpoints
├── core/                   # Business logic (hexagonal architecture)
│   ├── auth/              # Auth module
│   ├── user/              # User module
│   ├── task/              # Task module
│   └── common/            # Config and utilities
├── prisma/                # DB schema and migrations
├── tests/                 # Unit tests and Postman
└── docs/                  # Technical documentation
```

### Main Principles

- **Hexagonal Architecture**: Clear separation between domain, application, and infrastructure
- **SOLID**: Object-oriented design principles
- **DDD**: Domain-Driven Design with entities and value objects
- **Clean Code**: Readable and maintainable code
- **TDD**: Test-Driven Development with 93.6% coverage

### Technical Decisions

- **Serverless + Vercel**: Auto-scaling and low-cost deployment
- **Supabase**: Auth and PostgreSQL database as a service
- **Prisma ORM**: Type-safe database access
- **TypeScript**: Type safety and better DX

📖 **Detailed development process**: [docs/Report.md](docs/Report.md)

## 🚀 Installation and Run

### Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- Vercel CLI (optional for local dev)

### Local Installation

```bash
# Clone the repository
git clone https://github.com/Sebastian-411/serverless-task-home.git
cd serverless-task-home

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your credentials

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start in dev mode
npm run start:dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
GEMINI_API_KEY="..."  # Optional: AI-based summaries
```

## 📬 API Endpoints

### Auth

- `POST /api/auth/login` - User login

### User Management (requires auth)

- `GET /api/users` - List users (Admin)
- `POST /api/users` - Create user (Admin/Anonymous)
- `GET /api/users/[id]` - Get user (Admin/User)
- `PUT /api/users/[id]` - Update user (Admin)
- `DELETE /api/users/[id]` - Delete user (Admin)
- `PATCH /api/users/[id]/role` - Change user role (Admin)

### Task Management

- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `PATCH /api/tasks/[id]/assign` - Assign task
- `GET /api/tasks/summary` - Task summary (AI)

### Interactive Documentation

- **Swagger UI**: `/api/docs-swagger`
- **OpenAPI Spec**: `/docs/openapi.json`
- **Postman Collection**: `tests/postman/API_Complete_Collection.postman_collection.json`

### Usage Example

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Juansebastia4231"}'

# List users (needs token)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run core tests
npm run test:core

# Watch mode
npm run test:watch
```

### Quality Metrics

- **842 passing tests** in 43 test suites
- **93.6% statements**, **86.8% branches**
- **93.1% functions**, **94.2% lines**
- Minimum threshold: **80%** (set in CI/CD)

### Integration Tests

- **Postman Collection**: 25 tests for 8 endpoints
- **Env variables**: Configured for testing
- **Semantic validation**: Real behavior vs spec

## 📦 Deployment

### Vercel (Recommended)

```bash
# Deploy
vercel

# Deploy to production
vercel --prod
```

### Prod Environment Variables

Set in Vercel Dashboard:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

### CI/CD

- **Pre-commit hooks**: Auto lint and test
- **PR validation**: Tests and coverage check
- **Auto deploy**: On push to `main` branch

## 🤖 Main Technologies

| Technology     | Version | Role                |
| -------------- | ------- | ------------------- |
| **TypeScript** | 5.7.2   | Main language       |
| **Vercel**     | 44.2.6  | Serverless platform |
| **Supabase**   | 2.50.2  | Auth and database   |
| **Prisma**     | 6.10.1  | ORM                 |
| **Jest**       | 30.0.3  | Testing framework   |
| **Zod**        | 3.25.67 | Schema validation   |
| **Swagger**    | 6.2.8   | API docs            |

## 🧠 Architecture Decisions

### Hexagonal Architecture

- **Domain**: Pure business entities and rules
- **Application**: Use cases and logic
- **Infrastructure**: Adapters for DB, Auth, HTTP

### Security and Auth

- **JWT via Supabase**: Safe tokens with real-time check
- **Role-based auth**: Contextual and granular
- **Input validation**: With Zod schemas

### Database

- **PostgreSQL**: Relational with JSON support
- **Prisma ORM**: Type-safe with auto migrations
- **Optimized indexes**: 20+ for performance

### Serverless

- **Cold start optimization**: Small dependencies
- **Timeouts**: 30s per function
- **Connection pooling**: Reuse DB connections

## 🪪 Author & Credits

**Developed by**: [Sebastian](https://github.com/Sebastian-411)
**Contact**: [info@sebastiandiazdev.com](mailto:info@sebastiandiazdev.com)
**Repository**: [GitHub](https://github.com/Sebastian-411/serverless-task-home)

## Another resources

- **Issues**: [GitHub Issues](https://github.com/Sebastian-411/serverless-task-home/issues)
- **Docs**: [docs/](docs/)
- **Postman**: [Test Collection](tests/postman/)
