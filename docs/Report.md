# Diseño y evolución de una arquitectura serverless adaptable\*\*

Abordé este proyecto con la premisa de que el entorno de ejecución no debía condicionar la arquitectura. Aunque operativamente se construyó sobre un entorno serverless, el diseño debía ser agnóstico al hosting, resiliente al cambio e independiente del tiempo. Desde el principio me situé en un rol arquitectónico, donde las decisiones no se orientan a "resolver requerimientos", sino a **dar forma a una base evolutiva**.

---

### 🏛️ Estructura como contrato de futuro

La arquitectura fue concebida como un contrato: aquello que establece cómo las piezas se conectan sin conocerse. Bajo esa noción, separé explícitamente las responsabilidades entre la lógica del negocio y sus mecanismos de entrega. Las funciones serverless se asumieron como un tipo de adaptador, y no como el centro del diseño.

> La aplicación no fue diseñada _para_ serverless. Fue diseñada _desde_ la lógica de dominio, y serverless simplemente fue un adaptador más.

Esa separación me permitió formalizar el dominio sin contaminación externa, con capas que no dependen del transporte, la persistencia ni de frameworks. El dominio no conoce al mundo; solo se expresa mediante puertos.

---

### 🔄 Reversibilidad y desacoplamiento como principios

Cada decisión se midió bajo dos criterios:

1. ¿Es reversible sin dolor?
2. ¿Puede ser desacoplada sin romper comportamiento?

El uso de interfaces fue sistemático. No como patrón, sino como regla de gobernabilidad. El objetivo fue que las decisiones locales (como el tipo de base de datos, proveedor de auth o framework de routing) no se propagaran globalmente. Esto garantiza que el cambio de contexto (migrar a contenedores, FaaS distinto o incluso a un monolito) no implique reescritura, solo sustitución de adaptadores.

---

### ⚙️ Modularidad orientada a consistencia

Dividí el sistema en módulos que responden a consistencia funcional, no técnica. Cada componente existe porque representa una unidad conceptual de negocio (user, task) y cada módulo incluye sus propios contratos, casos de uso y adaptadores. Esto elimina el riesgo de módulos utilitarios ambiguos o infraestructuras globales opacas.

La infraestructura, lejos de ser un conjunto de helpers, se comporta como una colección de adaptadores inyectables. Ningún componente interno tiene conocimiento de su implementación.

---

### 🧪 Calidad validada por diseño

La validación del sistema no se limitó al testeo automatizado. Fue complementada por una verificación de **contratos explícitos** a través de herramientas externas, emulando consumidores reales. Se trabajó sobre flujos completos, evaluando tanto rutas autenticadas como condiciones límite. El objetivo era garantizar que la semántica de la API —más allá de su forma técnica— se comportara de acuerdo al modelo de negocio.

El uso de herramientas como **Postman** permitió simular de forma controlada distintas combinaciones de roles, datos y respuestas, funcionando como una validación exploratoria y semántica del comportamiento. Así, se contrastaron las definiciones del Swagger generado dinámicamente con su comportamiento real, identificando posibles desviaciones entre el diseño y la ejecución

---

### 🔐 Seguridad: el privilegio como contexto, no como regla

El modelo de roles no fue aplicado desde una política externa, sino como una condición de negocio encapsulada en los casos de uso. Esto asegura que las decisiones sobre permisos se mantengan **coherentes con el contexto funcional**, no solo técnicas.

Cada endpoint traduce una intención, y cada intención es evaluada según el sujeto y su relación con el objeto. Nada es implícito.

---

### 📦 Serverless: entorno optimizado, no restrictivo

El entorno serverless no fue una restricción, sino una oportunidad para validar la arquitectura. Cada cold start, cada limitación de acceso al filesystem, cada entorno de build fue un mecanismo de validación del diseño desacoplado.

Tuve que reconfigurar procesos como Swagger, compilación de TypeScript, y path resolution para cumplir con los contratos sin traicionar el diseño. La solución: adaptadores que transforman sin alterar.

---

## 📊 Criterios de Evaluación y Cumplimiento

### 🎯 **Code Quality and Organization**

**Arquitectura Hexagonal Implementada:**

- **Separación de capas**: Dominio, aplicación e infraestructura claramente delimitadas
- **Inversión de dependencias**: El dominio no conoce la infraestructura
- **Interfaces explícitas**: Puertos de entrada y salida bien definidos
- **Modularidad funcional**: Módulos `user`, `task`, `auth` con responsabilidades específicas

**Patrones de Diseño Aplicados:**

- **Repository Pattern**: Abstracción de persistencia con implementaciones Prisma
- **Use Case Pattern**: Lógica de negocio encapsulada en casos de uso específicos
- **Factory Pattern**: Creación de entidades con validación
- **Strategy Pattern**: Diferentes estrategias de autenticación y autorización

**Organización del Código:**

```
core/
├── user/           # Módulo de usuarios
│   ├── domain/     # Entidades y reglas de negocio
│   ├── application/# Casos de uso
│   └── infrastructure/ # Adaptadores
├── task/           # Módulo de tareas
└── common/         # Utilidades compartidas
```

### 🗄️ **Proper use of SQL database features**

**Esquema de Base de Datos Optimizado:**

- **Índices estratégicos**: 15+ índices compuestos para consultas complejas
- **Relaciones bien definidas**: Foreign keys con `onDelete` apropiados
- **Tipos de datos específicos**: `@db.VarChar(255)`, `@db.Text` para optimización
- **Enums nativos**: `UserRole`, `TaskStatus`, `TaskPriority` como tipos PostgreSQL

**Optimizaciones de Rendimiento:**

```sql
-- Índices compuestos para consultas frecuentes
@@index([role, createdAt])     -- Admin queries con ordenamiento
@@index([status, priority])    -- Filtrado por estado y prioridad
@@index([assignedTo, status])  -- Tareas de usuario por estado
@@index([country, stateOrProvince, city]) -- Jerarquía geográfica
```

**Características PostgreSQL Aprovechadas:**

- **UUID como primary keys**: Mejor distribución y seguridad
- **Timestamps automáticos**: `@default(now())`, `@updatedAt`
- **Constraints de unicidad**: Email único, addressId único
- **Cascading deletes**: Eliminación en cascada para mantener integridad

### 🧪 **Completeness of unit tests**

**Cobertura de Pruebas Exhaustiva:**

- **93.62% statements, 86.78% branches, 93.05% functions, 94.16% lines**
- **842 tests pasando** en 43 suites de prueba
- **Umbral de cobertura**: 80% mínimo configurado en CI/CD

**Estrategia de Testing:**

- **Tests unitarios**: Cada caso de uso, entidad y adaptador
- **Mocks estratégicos**: Repositorios, servicios externos, middleware
- **Casos edge**: Validación de errores, datos inválidos, permisos
- **Tests de integración**: Flujos completos con Postman

**Ejemplos de Cobertura:**

```typescript
// Tests de casos de uso con mocks
describe("DeleteUserUseCase", () => {
  it("should delete user when admin and user exists", async () => {
    // Arrange, Act, Assert con mocks completos
  });

  it("should fail when non-admin tries to delete", async () => {
    // Validación de permisos
  });
});
```

### ⚠️ **Error handling and edge cases**

**Sistema de Errores Jerárquico:**

- **DomainError**: Base para errores de dominio
- **EntityNotFoundError**: Entidades no encontradas
- **UnauthorizedError**: Errores de autenticación/autorización
- **ValidationError**: Errores de validación de datos

**Manejo de Casos Edge:**

- **Autenticación fallida**: Tokens inválidos, expirados, usuarios inexistentes
- **Autorización granular**: Roles específicos por operación
- **Validación de datos**: Emails, UUIDs, fechas, campos requeridos
- **Errores de infraestructura**: Fallos de base de datos, servicios externos

**Middleware de Manejo de Errores:**

```typescript
// Error handler middleware centralizado
export function errorHandler(
  error: Error,
  req: VercelRequest,
  res: VercelResponse,
) {
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ error: error.message });
  }
  // Mapeo de errores a códigos HTTP apropiados
}
```

### 🌐 **API design and documentation**

**Diseño RESTful Consistente:**

- **Endpoints semánticos**: `/api/users`, `/api/tasks`, `/api/auth/login`
- **Métodos HTTP apropiados**: GET, POST, PUT, DELETE
- **Códigos de estado HTTP**: 200, 201, 400, 401, 403, 404, 500
- **Respuestas estructuradas**: Formato JSON consistente

**Documentación Automática:**

- **OpenAPI 3.0**: Especificación completa en `/docs/openapi.json`
- **Swagger UI**: Interfaz interactiva para testing
- **Postman Collection**: 123KB de tests de integración
- **Ejemplos de uso**: Request/response examples en documentación

**Validación de Entrada:**

```typescript
// Middleware de validación con Zod
export function validateRequest(schema: ZodSchema) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      req.body = await schema.parseAsync(req.body);
    } catch (error) {
      return res.status(400).json({ error: "Validation failed" });
    }
  };
}
```

### 🔒 **Security considerations**

**Autenticación Robusta:**

- **JWT con Supabase**: Tokens seguros con verificación en tiempo real
- **Middleware de autenticación**: Verificación automática en endpoints protegidos
- **Validación de tokens**: Verificación con servicio externo + base de datos local

**Autorización Basada en Roles:**

- **Roles granulares**: `admin` y `user` con permisos específicos
- **Verificación contextual**: Permisos evaluados por operación
- **Protección de endpoints**: Middleware `createAuthenticatedEndpoint`

**Seguridad de Datos:**

- **Validación de entrada**: Sanitización con Zod schemas
- **Variables de entorno**: Configuración segura para credenciales
- **Logs seguros**: Información sensible no expuesta en logs

**Ejemplo de Autorización:**

```typescript
// Endpoint protegido con roles específicos
export default createAuthenticatedEndpoint(
  ["DELETE"],
  ["admin"],
)(async ({ authContext, pathParam }) => {
  // Solo admins pueden ejecutar esta operación
});
```

### ⚡ **Performance optimization techniques**

**Optimizaciones de Base de Datos:**

- **Índices estratégicos**: 20+ índices para consultas frecuentes
- **Consultas optimizadas**: Uso de Prisma con queries eficientes
- **Paginación**: Límites en consultas de listado
- **Caching**: Servicio de cache para datos frecuentemente accedidos

**Optimizaciones Serverless:**

- **Cold start optimization**: Dependencias minimizadas
- **Timeouts configurados**: `maxDuration: 30` en Vercel
- **Bundle optimization**: Tree shaking y code splitting
- **Connection pooling**: Reutilización de conexiones de base de datos

**Integración con IA:**

- **Gemini AI Service**: Resúmenes inteligentes de tareas
- **Procesamiento asíncrono**: Generación de resúmenes sin bloquear
- **Fallbacks**: Respuestas alternativas si la IA falla

**Monitoreo y Métricas:**

- **Logs estructurados**: Trazabilidad completa de operaciones
- **Error tracking**: Captura y reporte de errores
- **Performance monitoring**: Tiempos de respuesta y uso de recursos

---

## 🎯 **Resultados y Métricas**

### **Cobertura de Código:**

- **Statements**: 93.62%
- **Branches**: 86.78%
- **Functions**: 93.05%
- **Lines**: 94.16%

### **Tests:**

- **Total de tests**: 842
- **Suites de prueba**: 43
- **Tiempo de ejecución**: ~15 segundos
- **Configuración CI/CD**: Umbral de 80% mínimo

### **Arquitectura:**

- **Módulos principales**: 3 (user, task, auth)
- **Casos de uso**: 15+
- **Entidades de dominio**: 4
- **Adaptadores**: 8+
- **Endpoints API**: 12+

### **Base de Datos:**

- **Tablas**: 3 (users, tasks, addresses)
- **Índices**: 20+
- **Relaciones**: 6
- **Enums**: 3

---

Una buena arquitectura no se define por su forma, sino por su capacidad de mutar sin romper. Este proyecto fue una práctica deliberada de diseño evolutivo. El valor no está en el stack elegido, sino en que nada de ese stack es imprescindible.

**La arquitectura demostró ser:**

- ✅ **Evolutiva**: Cambios sin reescritura
- ✅ **Testeable**: 93%+ cobertura
- ✅ **Segura**: Autenticación y autorización robustas
- ✅ **Performante**: Optimizaciones en múltiples capas
- ✅ **Documentada**: APIs completamente especificadas
- ✅ **Mantenible**: Código organizado y modular
