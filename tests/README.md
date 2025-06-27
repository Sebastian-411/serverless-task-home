# Estructura de Testing

## Organización de Tests

La estructura de testing está organizada de manera clara y escalable:

```
tests/
├── setup.ts                           # Configuración global de tests
├── unit/                              # Tests unitarios organizados por dominio
│   ├── api/                          # Tests de endpoints API
│   │   ├── auth/                     # Autenticación
│   │   ├── tasks/                    # Endpoints de tareas
│   │   └── users/                    # Endpoints de usuarios
│   ├── core/                         # Tests de lógica de negocio
│   │   ├── task/                     # Dominio de tareas
│   │   │   ├── application/          # Casos de uso de tareas
│   │   │   ├── domain/               # Entidades de tareas
│   │   │   └── infrastructure/       # Repositorios de tareas
│   │   └── user/                     # Dominio de usuarios
│   │       ├── application/          # Casos de uso de usuarios ✅
│   │       ├── domain/               # Entidades de usuarios ✅
│   │       └── infrastructure/       # Repositorios de usuarios ✅
│   ├── mocks/                        # Sistema de mocks
│   │   ├── database/                 # Mocks de base de datos
│   │   ├── repositories/             # Mocks de repositorios
│   │   └── services/                 # Mocks de servicios externos
│   └── shared/                       # Tests de servicios compartidos
│       ├── auth/                     # Servicios de autenticación
│       ├── cache/                    # Sistema de caché
│       ├── config/                   # Configuraciones
│       ├── middlewares/              # Middlewares
│       └── utils/                    # Utilidades
└── postman/                          # Tests de integración con Postman
    ├── Local_Environment.postman_environment.json
    └── User_Management_API.postman_collection.json
```

## Scripts Disponibles

### Tests Unitarios
```bash
# Ejecutar todos los tests unitarios
npm run test:unit

# Ejecutar todos los tests (unitarios)
npm test

# Modo watch para desarrollo
npm run test:watch

# Reporte de cobertura
npm run test:coverage

# Reporte de cobertura en HTML
npm run test:coverage:html

# Verificar umbrales de cobertura
npm run coverage:check
```

### Tests de Integración
```bash
# Tests con Postman (manual)
npm run test:postman
```

## Cobertura Actual

### Dominio de Usuarios ✅
- **Statements**: 93.25% (Target: >80%)
- **Branches**: 94.35% (Target: >80%)
- **Functions**: 100% (Target: >80%)
- **Lines**: 93.02% (Target: >80%)

#### Detalle por Capa:
- **Domain Layer**: 100% statements, 98.21% branches
- **Application Layer**: 96.61% statements, 93.33% branches
- **Infrastructure Layer**: 80% statements, 75% branches

## Sistema de Mocks

### Database Mocks
- `prisma.mock.ts`: Mock completo de PrismaClient con datos de prueba

### Service Mocks
- `supabase.mock.ts`: Mock de servicios de autenticación
- `cache.mock.ts`: Mock del sistema de caché con TTL

### Repository Mocks
- `user.repository.mock.ts`: Mock del repositorio de usuarios

## Configuración

### Jest Configuration
- **Framework**: Jest con TypeScript support
- **Environment**: Node.js
- **Coverage**: Configurado para el dominio de usuarios
- **Mocks**: Configuración automática de mocks

### Custom Matchers
- `toBeValidDate()`: Valida objetos Date
- `toBeValidUUID()`: Valida formato UUID
- `toHaveValidUserStructure()`: Valida estructura de usuario
- `toHaveValidTaskStructure()`: Valida estructura de tarea

## Mejores Prácticas

### Organización de Tests
1. **Espejo del código fuente**: Los tests siguen la misma estructura que el código
2. **Separación por responsabilidades**: Unit tests vs Integration tests
3. **Naming conventions**: Nombres descriptivos y agrupación lógica
4. **Setup y teardown**: Configuración aislada entre tests

### Calidad de Tests
1. **Cobertura >80%**: Umbral mínimo establecido
2. **Mocks realistas**: Simulan comportamiento real de servicios
3. **Edge cases**: Validación de casos límite y errores
4. **Documentación**: Tests autodocumentados con descripciones claras

## Próximos Pasos

1. **Expandir tests API**: Agregar tests para endpoints REST
2. **Tests de Task Domain**: Implementar testing completo para tareas
3. **Tests de servicios compartidos**: Cache, auth, middlewares
4. **E2E con Postman**: Automatizar tests de integración
5. **Performance testing**: Tests de carga y rendimiento 