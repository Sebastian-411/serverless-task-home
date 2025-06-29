// Base Entity
export { 
  BaseEntity, 
  type Timestamp, 
  type UUID,
  type ITimestampedEntity,
  type IEntity,
  type IBaseEntity,
  type ValidationRule,
  type ValidationConfig
} from './base.entity';

// Value Objects
export * from './value-objects';

// Exceptions
export * from './exceptions';

// Re-export common types for convenience
export type {
  UserRole,
  UserId,
  ValidationResult,
  DomainEvent,
  Result,
  PaginationParams,
  PaginatedResult,
  QueryFilters,
  SortOrder,
  SearchParams,
  AuditInfo,
  SoftDeleteEntity,
  VersionedEntity,
  CacheKey,
  CacheValue,
  CacheTTL,
  CacheEntry,
  Environment,
  DatabaseConfig,
  AppConfig,
  DeepPartial,
  RequiredFields,
  OptionalFields,
  NonNullableFields,
  ValidationSchema,
  Transformer,
  EntityMapper,
  Repository,
  DomainService,
  EventHandler,
  EventBus
} from './value-objects/types'; 