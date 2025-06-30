# Serverless Task Home API

API RESTful construida con arquitectura hexagonal, desplegada en Vercel con autenticación Supabase y base de datos PostgreSQL.

## 🏗️ Arquitectura

- **Arquitectura Hexagonal (Clean Architecture)**
- **API RESTful** con endpoints para gestión de usuarios
- **Autenticación** con Supabase Auth
- **Base de datos** PostgreSQL con Prisma ORM
- **Storage** Supabase Storage para archivos de usuario
- **Despliegue** en Vercel (serverless)

## 🚀 Características

### Gestión de Usuarios
- ✅ Crear usuarios (Admin)
- ✅ Listar usuarios (Admin)
- ✅ Obtener usuario por ID (Admin)
- ✅ Actualizar usuario (Admin)
- ✅ Eliminar usuario (Admin) - **Incluye limpieza automática de Storage**
- ✅ Cambiar rol de usuario (Admin)

### Autenticación
- ✅ Login con email/password
- ✅ Verificación de tokens JWT
- ✅ Roles: Admin, User, Anonymous

### Storage Management
- ✅ **Eliminación automática de archivos** cuando se elimina un usuario
- ✅ **Limpieza completa de Storage** en reset de base de datos
- ✅ Scripts manuales para limpieza de Storage/Auth

## 📁 Estructura del Proyecto

```
serverless-task-home/
├── api/                    # Endpoints de Vercel
├── core/                   # Lógica de negocio (arquitectura hexagonal)
│   ├── auth/              # Módulo de autenticación
│   ├── user/              # Módulo de usuarios
│   └── common/            # Configuraciones y utilidades
├── prisma/                # Esquema y migraciones de BD
├── scripts/               # Scripts de utilidad
├── tests/                 # Tests unitarios y Postman
└── lib/                   # Código generado
```

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd serverless-task-home
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."  # Requerida para operaciones de admin
```

4. **Configurar base de datos**
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 🧪 Testing

### Tests Unitarios
```bash
# Todos los tests
npm test

# Tests con coverage
npm run test:coverage

# Tests del core con coverage
npm run test:core

# Tests en modo watch
npm run test:watch
```

### Tests de Postman
- **Colección completa**: `tests/postman/API_Complete_Collection.postman_collection.json`
- **25 tests** cubriendo 8 endpoints y 3 roles
- **Variables de entorno**: `tests/postman/Local_Environment.postman_environment.json`

## 🗄️ Base de Datos

### Comandos Prisma
```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Reset completo (incluye limpieza de Supabase)
npm run db:seed:dev

# Abrir Prisma Studio
npm run db:studio
```

### Seed de Datos
El seed crea automáticamente:
- **Usuario Admin**: `admin@test.com` / `Juansebastia4231`
- **Usuario Regular**: `user@test.com` / `Juansebastia4231`

## 🧹 Limpieza de Supabase

### Limpieza Automática
- **Eliminación de usuario**: Automáticamente elimina archivos de Storage
- **Reset de BD**: Limpia Auth y Storage completamente

### Scripts Manuales
```bash
# Limpiar solo Storage
npm run cleanup:storage

# Limpiar solo Auth
npm run cleanup:auth

# Limpiar Storage y Auth
npm run cleanup:all
```

## 📡 Endpoints API

### Autenticación
- `POST /api/auth/login` - Login de usuario

### Usuarios (requieren autenticación Admin)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/[id]` - Obtener usuario
- `PUT /api/users/[id]` - Actualizar usuario
- `PATCH /api/users/[id]` - Actualizar parcialmente
- `DELETE /api/users/[id]` - Eliminar usuario (incluye Storage)
- `PATCH /api/users/[id]/role` - Cambiar rol

## 🔐 Roles y Permisos

### Admin
- Acceso completo a todos los endpoints
- Puede crear, leer, actualizar y eliminar usuarios
- Puede cambiar roles de usuarios

### User
- Acceso limitado a endpoints de lectura
- No puede modificar otros usuarios

### Anonymous
- Solo puede hacer login
- No tiene acceso a endpoints protegidos

## 📋 Detalle Completo de Endpoints

### 🔐 **Autenticación**

#### `POST /api/auth/login`
- **Descripción**: Autenticación de usuario con email y password
- **Roles permitidos**: `Anonymous`, `User`, `Admin`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Respuesta exitosa** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "name": "User Name",
        "email": "user@example.com",
        "role": "admin",
        "phoneNumber": "+1234567890",
        "isActive": true,
        "emailVerified": true,
        "lastLoginAt": "2024-01-01T00:00:00Z",
        "address": {
          "id": "uuid",
          "addressLine1": "123 Main St",
          "addressLine2": "Apto 8B",
          "city": "Medellín",
          "stateOrProvince": "Antioquia",
          "postalCode": "050001",
          "country": "CO",
          "createdAt": "2024-01-01T00:00:00Z",
          "updatedAt": "2024-01-01T00:00:00Z"
        }
      },
      "token": "jwt_token_here"
    }
  }
  ```
- **Respuesta de error** (401):
  ```json
  {
    "success": false,
    "error": {
      "message": "Invalid credentials",
      "code": "INVALID_CREDENTIALS"
    }
  }
  ```

---

### 👥 **Gestión de Usuarios**

#### `GET /api/users`
- **Descripción**: Obtener lista paginada de usuarios
- **Roles permitidos**: `Admin`
- **Headers requeridos**: `Authorization: Bearer <token>`
- **Query parameters**:
  - `page` (opcional): Número de página (default: 1)
  - `limit` (opcional): Usuarios por página (default: 10, max: 100)
- **Respuesta exitosa** (200):
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "id": "uuid",
          "name": "User Name",
          "email": "user@example.com",
          "role": "admin",
          "phoneNumber": "+1234567890",
          "isActive": true,
          "emailVerified": true,
          "lastLoginAt": "2024-01-01T00:00:00Z",
          "address": { ... }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25,
        "totalPages": 3
      }
    }
  }
  ```
- **Respuesta de error** (401/403):
  ```json
  {
    "success": false,
    "error": {
      "message": "Only administrators can access users list",
      "code": "UNAUTHORIZED"
    }
  }
  ```

#### `POST /api/users`
- **Descripción**: Crear nuevo usuario
- **Roles permitidos**: `Admin`, `Anonymous` (solo para registro de usuarios regulares)
- **Headers requeridos**: `Authorization: Bearer <token>` (solo para Admin)
- **Body**:
  ```json
  {
    "name": "New User",
    "email": "newuser@example.com",
    "password": "Password123",
    "phoneNumber": "+1234567890",
    "role": "user",
    "address": {
      "addressLine1": "123 Main St",
      "addressLine2": "Apto 8B",
      "city": "Medellín",
      "stateOrProvince": "Antioquia",
      "postalCode": "050001",
      "country": "CO"
    }
  }
  ```
- **Restricciones**:
  - `Anonymous` solo puede crear usuarios con `role: "user"`
  - `Admin` puede crear usuarios con cualquier rol
- **Respuesta exitosa** (201):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "name": "New User",
        "email": "newuser@example.com",
        "role": "user",
        "phoneNumber": "+1234567890",
        "isActive": true,
        "emailVerified": false,
        "address": {
          "id": "uuid",
          "addressLine1": "123 Main St",
          "addressLine2": "Apto 8B",
          "city": "Medellín",
          "stateOrProvince": "Antioquia",
          "postalCode": "050001",
          "country": "CO",
          "createdAt": "2024-01-01T00:00:00Z",
          "updatedAt": "2024-01-01T00:00:00Z"
        }
      }
    }
  }
  ```

#### `GET /api/users/[id]`
- **Descripción**: Obtener usuario específico por ID
- **Roles permitidos**: `Admin`, `User` (solo su propio perfil)
- **Headers requeridos**: `Authorization: Bearer <token>`
- **Respuesta exitosa** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "name": "User Name",
        "email": "user@example.com",
        "role": "admin",
        "phoneNumber": "+1234567890",
        "isActive": true,
        "emailVerified": true,
        "lastLoginAt": "2024-01-01T00:00:00Z",
        "address": { ... }
      }
    }
  }
  ```
- **Respuesta de error** (403):
  ```json
  {
    "success": false,
    "error": {
      "message": "You can only access your own profile",
      "code": "FORBIDDEN"
    }
  }
  ```

#### `PUT /api/users/[id]`
- **Descripción**: Actualizar usuario completo
- **Roles permitidos**: `Admin`
- **Headers requeridos**: `Authorization: Bearer <token>`
- **Body** (todos los campos requeridos):
  ```json
  {
    "name": "Updated Name",
    "email": "updated@example.com",
    "phoneNumber": "+1234567890",
    "role": "admin",
    "address": {
      "addressLine1": "456 New St",
      "addressLine2": "Piso 3",
      "city": "Bogotá",
      "stateOrProvince": "Cundinamarca",
      "postalCode": "110111",
      "country": "CO"
    }
  }
  ```
- **Respuesta exitosa** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "name": "Updated Name",
        "email": "updated@example.com",
        "role": "admin",
        "phoneNumber": "+1234567890",
        "isActive": true,
        "emailVerified": true,
        "lastLoginAt": "2024-01-01T00:00:00Z",
        "address": { ... }
      }
    }
  }
  ```

#### `PATCH /api/users/[id]`
- **Descripción**: Actualizar usuario parcialmente
- **Roles permitidos**: `Admin`
- **Headers requeridos**: `Authorization: Bearer <token>`
- **Body** (campos opcionales):
  ```json
  {
    "name": "Updated Name",
    "phoneNumber": "+1234567890"
  }
  ```
- **Respuesta exitosa** (200): Similar a PUT

#### `DELETE /api/users/[id]`
- **Descripción**: Eliminar usuario (incluye limpieza automática de Storage)
- **Roles permitidos**: `Admin`
- **Headers requeridos**: `Authorization: Bearer <token>`
- **Restricciones**: No se puede eliminar el propio usuario admin
- **Funcionalidad**: 
  - Elimina usuario de Supabase Auth
  - Elimina archivos del usuario en Supabase Storage
  - Elimina usuario de base de datos local
- **Respuesta exitosa** (200):
  ```json
  {
    "success": true,
    "data": {
      "message": "User deleted successfully"
    }
  }
  ```
- **Respuesta de error** (403):
  ```json
  {
    "success": false,
    "error": {
      "message": "Administrators cannot delete their own account",
      "code": "FORBIDDEN"
    }
  }
  ```

#### `PATCH /api/users/[id]/role`
- **Descripción**: Cambiar rol de usuario
- **Roles permitidos**: `Admin`
- **Headers requeridos**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "role": "admin"
  }
  ```
- **Restricciones**: No se puede cambiar el propio rol
- **Respuesta exitosa** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "name": "User Name",
        "email": "user@example.com",
        "role": "admin",
        "phoneNumber": "+1234567890",
        "isActive": true,
        "emailVerified": true,
        "lastLoginAt": "2024-01-01T00:00:00Z",
        "address": { ... }
      }
    }
  }
  ```

---

### 📊 **Códigos de Estado HTTP**

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - No autorizado para la operación |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: email ya existe) |
| 422 | Unprocessable Entity - Validación fallida |
| 500 | Internal Server Error - Error del servidor |

### 🔒 **Autenticación y Autorización**

#### Headers Requeridos
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Estructura del Token JWT
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### 📝 **Validaciones**

#### Email
- Formato válido de email
- Máximo 255 caracteres
- Normalizado a minúsculas

#### Password
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número

#### Name
- Mínimo 1 carácter
- Máximo 100 caracteres
- Trim de espacios

#### Phone Number
- Formato internacional (+1234567890)
- Validación de formato

#### Role
- Valores permitidos: `"admin"`, `"user"`
- Case insensitive

### 🗄️ **Base de Datos**

#### Esquema de Usuario
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  phoneNumber VARCHAR(20),
  isActive BOOLEAN DEFAULT true,
  emailVerified BOOLEAN DEFAULT false,
  lastLoginAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Esquema de Dirección
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  addressLine1 VARCHAR(500) NOT NULL,
  addressLine2 VARCHAR(500),
  city VARCHAR(100) NOT NULL,
  stateOrProvince VARCHAR(100) NOT NULL,
  postalCode VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Despliegue

### Vercel
```bash
# Desplegar
vercel

# Desplegar en producción
vercel --prod
```

### Variables de Entorno en Vercel
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📊 Monitoreo

### Logs
- Logs detallados de eliminación de usuarios
- Logs de limpieza de Storage
- Logs de operaciones de Auth

### Métricas
- Tiempo de respuesta de endpoints
- Cobertura de tests
- Estado de la base de datos

## 🔧 Desarrollo

### Estructura de Commits
- `feat:` Nuevas características
- `fix:` Correcciones de bugs
- `docs:` Documentación
- `test:` Tests
- `refactor:` Refactorización

### Pre-commit Hooks
- Linting automático con ESLint
- Tests unitarios
- Validación de tipos TypeScript

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Revisar la documentación de Postman
- Consultar los logs de la aplicación

## Matriz de permisos por endpoint y rol

| Endpoint                | ADMIN                                                                 | USER                                 | NO AUTH                                  |
|-------------------------|-----------------------------------------------------------------------|--------------------------------------|-------------------------------------------|
| **GET /users**          | Puede acceder a todos los usuarios                                    | No puede acceder a ninguno           | No puede acceder                         |
| **GET /users/:id**      | Puede acceder a cualquier usuario                                     | Solo puede acceder a su propio perfil| No puede acceder                         |
| **POST /users**         | Puede crear usuarios (tanto USER como ADMIN)                          | No puede crear usuarios              | Puede registrarse solo como USER          |
| **PATCH /users/:id/role** | Puede cambiar el rol a cualquier usuario                            | No puede cambiar el rol a nadie      | No puede acceder                         |

### Lógica de acceso y validaciones

- **GET /users**
  - Solo ADMIN puede listar todos los usuarios.
  - USER y NO AUTH reciben error de autorización.

- **GET /users/:id**
  - ADMIN puede consultar cualquier usuario.
  - USER solo puede consultar su propio usuario (por su ID).
  - NO AUTH recibe error de autorización.

- **POST /users**
  - ADMIN puede crear usuarios de cualquier rol (USER o ADMIN).
  - USER no puede crear usuarios.
  - NO AUTH puede registrarse, pero solo como USER (no puede auto-registrarse como ADMIN).

- **PATCH /users/:id/role**
  - Solo ADMIN puede cambiar el rol de cualquier usuario.
  - USER no puede cambiar el rol de nadie (ni el suyo ni el de otros).
  - NO AUTH no tiene acceso.

#### Notas adicionales
- Todos los endpoints (excepto el registro de usuario) requieren autenticación con token válido.
- La autorización se valida estrictamente según el rol y la identidad del usuario.
- Si NO AUTH intenta crear un usuario con rol distinto a USER, la petición será rechazada.
- Si un USER intenta acceder a recursos de otros usuarios o realizar acciones administrativas, recibirá un error de autorización.
- Los mensajes de error siguen el formato estándar de la API con códigos HTTP apropiados (401, 403, etc).