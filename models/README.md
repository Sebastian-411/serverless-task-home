# 📁 Models Directory

Este directorio contiene todos los modelos de datos organizados de forma estructurada siguiendo principios de clean architecture.

## 🏗️ Estructura

```
models/
├── entities/           # Entidades del dominio
│   ├── User.js        # Modelo de usuario
│   ├── Task.js        # Modelo de tarea
│   └── Address.js     # Modelo de dirección
├── base/              # Clases base y abstractas
│   └── BaseModel.js   # Clase base para todos los modelos
├── validators/        # Validadores y errores
│   └── ValidationError.js # Error personalizado de validación
├── utils/            # Utilidades y constantes
│   └── constants.js  # Constantes del dominio
└── index.js          # Punto de entrada principal
```

## 📚 Descripción de Carpetas

### 🎯 **entities/**
Contiene las entidades principales del dominio del negocio:
- **User.js**: Modelo completo de usuario con validaciones y métodos de negocio
- **Task.js**: Modelo de tareas con estados, prioridades y lógica de negocio
- **Address.js**: Modelo de direcciones con validaciones de formato

### 🏛️ **base/**
Clases base y abstractas que proporcionan funcionalidad común:
- **BaseModel.js**: Clase abstracta con validaciones comunes, manejo de timestamps y métodos helper

### ✅ **validators/**
Sistema de validación y manejo de errores:
- **ValidationError.js**: Error personalizado con mensajes estructurados para validaciones

### 🔧 **utils/**
Utilidades y configuraciones del dominio:
- **constants.js**: Enumeraciones y reglas de validación centralizadas

## 🚀 Uso

### Importación Simple
```javascript
const { User, Task, Address } = require('./models');
```

### Importación Organizada
```javascript
const { 
  entities: { User, Task, Address },
  validators: { ValidationError },
  USER_ROLES,
  TASK_STATUS 
} = require('./models');
```

### Crear Entidades
```javascript
// Usuario con dirección
const user = User.create({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  phoneNumber: '+1234567890',
  address: {
    addressLine1: '123 Main St',
    city: 'Madrid',
    stateOrProvince: 'Madrid',
    postalCode: '28001',
    country: 'España'
  },
  role: 'user'
});

// Tarea
const task = Task.create({
  title: 'Implementar funcionalidad',
  description: 'Crear nuevos endpoints',
  dueDate: new Date('2024-12-31'),
  createdBy: user.id,
  priority: 'high'
});
```

## ✨ Beneficios de esta Estructura

### 🎯 **Organización Clara**
- Separación lógica por responsabilidades
- Fácil navegación y mantenimiento
- Escalabilidad para nuevos modelos

### 🔒 **Principios SOLID**
- **Single Responsibility**: Cada clase tiene una responsabilidad específica
- **Open/Closed**: Extensible sin modificar código existente
- **Dependency Inversion**: Dependencias a través de abstracciones

### 🧪 **Testeable**
- Modelos independientes y desacoplados
- Validaciones centralizadas y reutilizables
- Fácil creación de mocks y stubs

### 🚀 **Productividad**
- Importaciones organizadas y predecibles
- Reutilización de código común
- Documentación clara de responsabilidades

## 🔄 Migración desde Estructura Anterior

Los archivos fueron reorganizados manteniendo la misma funcionalidad:

```
// Antes
models/User.js → models/entities/User.js
models/BaseModel.js → models/base/BaseModel.js
models/ValidationError.js → models/validators/ValidationError.js
models/constants.js → models/utils/constants.js

// Las importaciones siguen funcionando igual
const { User, Task, Address } = require('./models');
```

## 📝 Convenciones

### 🏷️ **Nomenclatura**
- **Entities**: PascalCase (User, Task, Address)
- **Methods**: camelCase (isAdmin, getFormattedAddress)
- **Constants**: UPPER_SNAKE_CASE (USER_ROLES, TASK_STATUS)

### 📁 **Estructura de Archivos**
- Un modelo por archivo
- Nombres descriptivos y claros
- Documentación JSDoc completa

### 🎨 **Patrones de Diseño**
- **Factory Pattern**: Métodos `create()` y `fromPrisma()`
- **Builder Pattern**: Métodos de configuración encadenados
- **Strategy Pattern**: Validaciones configurables por tipo

¡Esta estructura proporciona una base sólida y escalable para el crecimiento futuro del proyecto! 🚀 