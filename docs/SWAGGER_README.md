# Documentación de la API con Swagger

Este proyecto incluye documentación automática de la API usando Swagger/OpenAPI 3.0.0.

## 📋 Características

- **Documentación automática**: Generada desde comentarios JSDoc en los archivos de la API
- **Interfaz interactiva**: Swagger UI para probar endpoints directamente
- **Esquemas completos**: Definición de todos los modelos de datos
- **Autenticación**: Documentación del sistema de autenticación JWT
- **Códigos de respuesta**: Todos los posibles códigos de estado HTTP

## 🚀 Endpoints de Documentación

### 1. Especificación OpenAPI (JSON)
```
GET /api/docs
```
Retorna la especificación OpenAPI en formato JSON.

### 2. Interfaz Swagger UI
```
GET /api/docs/swagger-ui
```
Proporciona una interfaz web interactiva para explorar y probar la API.

## 📁 Estructura de Archivos

```
swagger/
├── swaggerConfig.ts          # Configuración principal de Swagger
api/
├── docs/
│   ├── index.ts              # Endpoint para servir JSON de OpenAPI
│   └── swagger-ui.ts         # Endpoint para servir Swagger UI
├── auth/
│   └── login.ts              # Documentado con JSDoc
├── users/
│   ├── index.ts              # Documentado con JSDoc
│   ├── [id].ts               # Documentado con JSDoc
│   └── [id]/
│       ├── tasks.ts          # Documentado con JSDoc
│       └── role.ts           # Documentado con JSDoc
└── tasks/
    ├── index.ts              # Documentado con JSDoc
    ├── [id].ts               # Documentado con JSDoc
    └── [id]/
        └── assign.ts         # Documentado con JSDoc
```

## 🔧 Configuración

### Dependencias Instaladas
```json
{
  "swagger-ui-express": "^5.0.0",
  "swagger-jsdoc": "^6.2.8",
  "@types/swagger-ui-express": "^4.1.6",
  "@types/swagger-jsdoc": "^6.0.4"
}
```

### Configuración de Swagger
El archivo `swagger/swaggerConfig.ts` contiene:

- **Información de la API**: Título, versión, descripción
- **Servidores**: URLs de desarrollo y producción
- **Esquemas**: Definición de modelos (User, Task, Error, etc.)
- **Autenticación**: Configuración JWT Bearer
- **Rutas**: Patrón para encontrar archivos de la API

## 📝 Documentación de Endpoints

Cada endpoint está documentado usando comentarios JSDoc con la sintaxis OpenAPI:

```typescript
/**
 * @openapi
 * /api/endpoint:
 *   method:
 *     tags:
 *       - Tag
 *     summary: Resumen del endpoint
 *     description: Descripción detallada
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path/query
 *         name: paramName
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Model'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Model'
 */
```

## 🏷️ Esquemas Definidos

### User
```typescript
{
  id: string (UUID)
  email: string (email)
  name: string
  role: "ADMIN" | "USER" | "MANAGER"
  createdAt: string (date-time)
  updatedAt: string (date-time)
}
```

### Task
```typescript
{
  id: string (UUID)
  title: string
  description: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  assignedTo: string (UUID)
  createdBy: string (UUID)
  createdAt: string (date-time)
  updatedAt: string (date-time)
}
```

### Error
```typescript
{
  error: string
  message: string
  details?: object
}
```

## 🔐 Autenticación

La API usa autenticación JWT Bearer. Para usar endpoints protegidos:

1. **Obtener token**: `POST /api/auth/login`
2. **Usar token**: Incluir en header `Authorization: Bearer <token>`

## 🧪 Probar la API

### Usando Swagger UI
1. Navegar a `/api/docs/swagger-ui`
2. Hacer clic en "Authorize" y agregar el token JWT
3. Probar endpoints directamente desde la interfaz

### Usando Postman
1. Importar la colección desde `tests/postman/API_Complete_Collection.postman_collection.json`
2. Configurar variables de entorno
3. Ejecutar las pruebas

## 📊 Endpoints Documentados

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/{id}` - Obtener usuario por ID
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario
- `PATCH /api/users/{id}/role` - Cambiar rol de usuario
- `GET /api/users/{id}/tasks` - Obtener tareas de usuario

### Tareas
- `GET /api/tasks` - Listar tareas
- `POST /api/tasks` - Crear tarea
- `GET /api/tasks/{id}` - Obtener tarea por ID
- `PUT /api/tasks/{id}` - Actualizar tarea
- `DELETE /api/tasks/{id}` - Eliminar tarea
- `POST /api/tasks/{id}/assign` - Asignar tarea

## 🚀 Despliegue

### Desarrollo Local
```bash
npm run start:dev
# Acceder a http://localhost:3000/api/docs/swagger-ui
```

### Producción
```bash
npm run deploy
# La documentación estará disponible en tu dominio de Vercel
```

## 🔄 Actualizar Documentación

Para agregar documentación a nuevos endpoints:

1. Agregar comentarios JSDoc con sintaxis OpenAPI
2. Definir esquemas en `swaggerConfig.ts` si es necesario
3. La documentación se genera automáticamente

## 📚 Recursos Adicionales

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express) 