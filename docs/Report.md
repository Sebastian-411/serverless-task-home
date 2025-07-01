# **Design and Evolution of an Adaptable Serverless Architecture**

I started this project with the idea that the runtime environment should not define the architecture. Even though we used a serverless environment, the design needed to be independent of the hosting, flexible to changes, and able to last over time. From the beginning, I took the role of an architect, focusing not only on requirements but on **building a strong base for future growth**.

---

### 🏛️ Structure as a Contract for the Future

The architecture was designed like a contract — something that defines how parts connect without knowing each other. I clearly separated business logic from delivery mechanisms. Serverless functions were used only as **adapters**, not as the main part of the design.

> The app was not designed _for_ serverless. It was designed _from_ the domain logic, and serverless was just one adapter.

This allowed me to build the domain without external dependencies, using layers that don’t depend on transport, storage, or frameworks. The domain doesn’t know about the outside world; it only communicates through ports.

---

### 🔄 Reversibility and Decoupling as Core Principles

Every decision followed two questions:

1. Is it easy to reverse?
2. Can we change it without breaking behavior?

Interfaces were used everywhere — not just as a pattern but as a rule. The idea was to make local decisions (like choosing a database or auth provider) without affecting the whole system. This way, we can switch to containers, another FaaS, or even a monolith without rewriting code — only changing the adapters.

---

### ⚙️ Modularity Based on Business Consistency

I organized the system in modules that represent business logic, not just technical parts. Each module (like `user` or `task`) has its own contracts, use cases, and adapters. This avoids unclear utility modules or global infrastructure files.

The infrastructure is not just helpers — it’s a set of injectible adapters. No internal module knows how they are implemented.

---

### 🧪 Quality by Design

Quality was not only tested with automated tests. We also checked **explicit contracts** using tools like Postman, simulating real user flows. We tested both authenticated routes and edge cases to make sure the API’s meaning matched the business logic.

Postman helped test different roles, inputs, and responses. We compared the Swagger documentation with the real behavior to find any differences.

---

### 🔐 Security: Privilege as Context, Not Rule

Role logic was not added from outside, but inside each use case. This makes sure that **permissions match business context**, not just technical checks.

Each endpoint represents an action, and we check the person and their relation to the object. Nothing is assumed.

---

### 📦 Serverless: An Opportunity, Not a Limitation

Serverless was not a problem — it was a way to test our architecture. Cold starts, file system access, and build steps all helped validate the design.

I had to adapt things like Swagger generation, TypeScript compilation, and path resolution to work correctly without changing the architecture. We solved it by using adapters.

---

## 📊 Evaluation Criteria and Results

### 🎯 **Code Quality and Organization**

**Hexagonal Architecture Used:**

- **Layer separation**: Domain, application, infrastructure
- **Dependency inversion**: Domain does not depend on infrastructure
- **Interfaces**: Clear input/output ports
- **Functional modules**: `user`, `task`, `auth` modules with clear roles

**Design Patterns Applied:**

- **Repository Pattern**: Separate data layer using Prisma
- **Use Case Pattern**: Business logic in separate use cases
- **Factory Pattern**: Entity creation with validation
- **Strategy Pattern**: Auth and permission strategies

**Code Organization:**

```
core/
├── user/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── task/
└── common/
```

---

### 🗄️ **Proper Use of SQL Features**

**Optimized Schema:**

- **15+ composite indexes** for better queries
- **Clear relationships** with foreign keys and onDelete
- **Specific data types** like `@db.VarChar(255)`
- **Native enums** for role, task status, and priority

**Performance Optimizations:**

```sql
@@index([role, createdAt])
@@index([status, priority])
@@index([assignedTo, status])
@@index([country, stateOrProvince, city])
```

**PostgreSQL Features:**

- **UUID primary keys**
- **Auto timestamps**
- **Unique constraints**
- **Cascading deletes**

---

### 🧪 **Unit Test Coverage**

**Strong Coverage:**

- **93.62% statements, 86.78% branches**
- **842 tests in 43 test suites**
- **CI/CD threshold at 80%**

**Testing Strategy:**

- **Unit tests** for use cases and adapters
- **Mocks** for repositories and services
- **Edge cases** with invalid data and permission errors
- **Integration tests** with Postman

Example:

```typescript
describe("DeleteUserUseCase", () => {
  it("should delete user when admin and user exists", async () => {
    // test with mocks
  });

  it("should fail when non-admin tries to delete", async () => {
    // test for permissions
  });
});
```

---

### ⚠️ **Error Handling and Edge Cases**

**Error Types:**

- **DomainError**
- **EntityNotFoundError**
- **UnauthorizedError**
- **ValidationError**

**Handled Cases:**

- **Auth errors**: Invalid/expired tokens
- **Granular permissions**
- **Input validation**: Emails, UUIDs, dates
- **Infra errors**: DB/service failures

Example middleware:

```typescript
export function errorHandler(error: Error, req, res) {
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ error: error.message });
  }
}
```

---

### 🌐 **API Design and Documentation**

**RESTful API:**

- Endpoints like `/api/users`, `/api/tasks`
- Methods: GET, POST, PUT, DELETE
- Status codes: 200, 201, 400, 401, etc.
- Consistent JSON responses

**Docs:**

- **OpenAPI 3.0**
- **Swagger UI**
- **Postman Collection (123KB)**
- **Request/response examples**

Example validation:

```typescript
export function validateRequest(schema) {
  return async (req, res) => {
    try {
      req.body = await schema.parseAsync(req.body);
    } catch {
      return res.status(400).json({ error: "Validation failed" });
    }
  };
}
```

---

### 🔒 **Security Considerations**

**Auth:**

- **JWT via Supabase**
- **Middleware** for auth check
- **Token validation** with external + local check

**Role-based Access:**

- `admin`, `user` roles
- Context-aware permissions
- Protected endpoints

**Data Security:**

- Input validation with Zod
- Env variables for secrets
- Safe logging

Example:

```typescript
export default createAuthenticatedEndpoint(
  ["DELETE"],
  ["admin"],
)(async ({ authContext, pathParam }) => {
  // Only admins can run this
});
```

---

### ⚡ **Performance Optimization**

**Database:**

- 20+ indexes
- Prisma with optimized queries
- Pagination
- Caching

**Serverless:**

- Smaller dependencies
- Timeouts: `maxDuration: 30`
- Tree shaking and code splitting
- DB connection pooling

**AI Integration:**

- Gemini AI for task summaries
- Async processing
- Fallback responses

**Monitoring:**

- Structured logs
- Error tracking
- Performance metrics

---

## 🎯 **Results and Metrics**

### **Code Coverage:**

- **Statements**: 93.62%
- **Branches**: 86.78%
- **Functions**: 93.05%
- **Lines**: 94.16%

### **Tests:**

- **842 total tests**
- **43 suites**
- **\~15 seconds runtime**
- **CI/CD: 80% threshold**

### **Architecture:**

- 3 main modules: `user`, `task`, `auth`
- 15+ use cases
- 4 domain entities
- 8+ adapters
- 12+ API endpoints

### **Database:**

- 3 tables: `users`, `tasks`, `addresses`
- 20+ indexes
- 6 relationships
- 3 enums

---

A good architecture is not defined by shape, but by its ability to change without breaking. This project was a deliberate exercise in **evolutionary design**. The value is not in the tools we used, but in the fact that **none of them are required**.

**This architecture proved to be:**

- **Evolvable**: Change without rewriting
- **Testable**: 93%+ coverage
- **Secure**: Strong auth and permissions
- **Performant**: Optimized at multiple levels
- **Well-documented**: Complete API specs
- **Maintainable**: Organized and modular code
