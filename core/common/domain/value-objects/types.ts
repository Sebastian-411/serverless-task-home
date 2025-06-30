// Branded types para mayor seguridad de tipos
/**
 * Branded type for enhanced type safety.
 *
 * @template T - The base type.
 * @template B - The brand identifier.
 */
export type Brand<T, B> = T & { __brand: B };

// Tipos con marca para IDs
/**
 * Branded type for User IDs.
 */
export type UserId = Brand<string, 'UserId'>;

// Tipos para estados y roles
/**
 * User role type: 'user' or 'admin'.
 */
export type UserRole = 'user' | 'admin';

// Tipos para validación
/**
 * Result of a validation operation.
 *
 * @template T - The validated type.
 */
export type ValidationResult<T> = {
  isValid: boolean;
  value?: T;
  errors: string[];
};

// Tipos para operaciones de dominio
/**
 * Domain event structure for event sourcing and messaging.
 *
 * @template T - The event data type.
 */
export type DomainEvent<T = unknown> = {
  id: string;
  type: string;
  data: T;
  timestamp: string;
  version: number;
};

// Tipos para resultados de operaciones
/**
 * Result type for domain operations, representing success or failure.
 *
 * @template T - The success data type.
 * @template E - The error type (default: Error).
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Tipos para paginación
/**
 * Pagination parameters for queries.
 */
export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

/**
 * Result of a paginated query.
 *
 * @template T - The data type.
 */
export type PaginationResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// Tipos para filtros
/**
 * Supported filter operators for queries.
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';

/**
 * Single filter condition for queries.
 *
 * @template T - The entity type.
 */
export type FilterCondition<T = unknown> = {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
};

/**
 * Group of filter conditions (AND/OR logic).
 *
 * @template T - The entity type.
 */
export type FilterGroup<T = unknown> = {
  operator: 'AND' | 'OR';
  conditions: (FilterCondition<T> | FilterGroup<T>)[];
};

/**
 * Filters for queries, as a group.
 *
 * @template T - The entity type.
 */
export type Filters<T = unknown> = FilterGroup<T>;

// Tipos para ordenamiento
/**
 * Sort order for queries: ascending or descending.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort field and order for queries.
 *
 * @template T - The entity type.
 */
export type SortField<T = unknown> = {
  field: keyof T;
  order: SortOrder;
};

/**
 * Array of sort options for queries.
 *
 * @template T - The entity type.
 */
export type SortOptions<T = unknown> = SortField<T>[];

// Tipos para consultas
/**
 * Query options for repositories and services.
 *
 * @template T - The entity type.
 */
export type QueryOptions<T = unknown> = {
  filters?: Filters<T>;
  sort?: SortOptions<T>;
  pagination?: PaginationParams;
  include?: (keyof T)[];
  select?: (keyof T)[];
};

// Tipos para DTOs
/**
 * DTO type for creating entities (excludes id and timestamps).
 *
 * @template T - The entity type.
 */
export type CreateDTO<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * DTO type for updating entities (partial create DTO).
 *
 * @template T - The entity type.
 */
export type UpdateDTO<T> = Partial<CreateDTO<T>>;

/**
 * DTO type for API responses.
 *
 * @template T - The entity type.
 */
export type ResponseDTO<T> = T;

// Tipos para mapeo
/**
 * Function type for mapping an entity to a DTO.
 *
 * @template TEntity - The entity type.
 * @template TDTO - The DTO type.
 */
export type EntityToDTO<TEntity, TDTO> = (entity: TEntity) => TDTO;

/**
 * Function type for mapping a DTO to an entity.
 *
 * @template TDTO - The DTO type.
 * @template TEntity - The entity type.
 */
export type DTOToEntity<TDTO, TEntity> = (dto: TDTO) => TEntity;

// Tipos para repositorios genéricos
/**
 * Generic repository interface for CRUD operations.
 *
 * @template TEntity - The entity type.
 * @template TId - The ID type (default: string).
 */
export interface IRepository<TEntity, TId = string> {
  /**
   * Finds an entity by its ID.
   * @param {TId} id - The entity ID.
   * @returns {Promise<TEntity | null>} The entity or null if not found.
   */
  findById(id: TId): Promise<TEntity | null>;
  /**
   * Finds all entities matching the query options.
   * @param {QueryOptions<TEntity>} [options] - Query options.
   * @returns {Promise<PaginationResult<TEntity>>} Paginated result.
   */
  findAll(options?: QueryOptions<TEntity>): Promise<PaginationResult<TEntity>>;
  /**
   * Creates a new entity.
   * @param {CreateDTO<TEntity>} data - Data for creation.
   * @returns {Promise<TEntity>} The created entity.
   */
  create(data: CreateDTO<TEntity>): Promise<TEntity>;
  /**
   * Updates an entity by ID.
   * @param {TId} id - The entity ID.
   * @param {UpdateDTO<TEntity>} data - Data for update.
   * @returns {Promise<TEntity>} The updated entity.
   */
  update(id: TId, data: UpdateDTO<TEntity>): Promise<TEntity>;
  /**
   * Deletes an entity by ID.
   * @param {TId} id - The entity ID.
   * @returns {Promise<void>} Resolves when deleted.
   */
  delete(id: TId): Promise<void>;
  /**
   * Checks if an entity exists by ID.
   * @param {TId} id - The entity ID.
   * @returns {Promise<boolean>} True if exists, false otherwise.
   */
  exists(id: TId): Promise<boolean>;
  /**
   * Counts entities matching the filters.
   * @param {Filters<TEntity>} [filters] - Optional filters.
   * @returns {Promise<number>} The count.
   */
  count(filters?: Filters<TEntity>): Promise<number>;
}

// Tipos para servicios de dominio
/**
 * Generic domain service interface.
 *
 * @template TEntity - The entity type.
 * @template TId - The ID type (default: string).
 */
export interface IDomainService<TEntity, TId = string> {
  /**
   * Validates an entity.
   * @param {TEntity} entity - The entity to validate.
   * @returns {ValidationResult<TEntity>} The validation result.
   */
  validate(entity: TEntity): ValidationResult<TEntity>;
  /**
   * Processes an entity (business logic).
   * @param {TEntity} entity - The entity to process.
   * @returns {Promise<TEntity>} The processed entity.
   */
  process(entity: TEntity): Promise<TEntity>;
  /**
   * Transforms an entity for output or other use.
   * @param {TEntity} entity - The entity to transform.
   * @returns {unknown} The transformed result.
   */
  transform(entity: TEntity): unknown;
}

// Tipos para eventos de dominio
/**
 * Event bus interface for domain events.
 */
export interface IEventBus {
  /**
   * Publishes a domain event.
   * @param {DomainEvent} event - The event to publish.
   * @returns {Promise<void>} Resolves when published.
   */
  publish(event: DomainEvent): Promise<void>;
  /**
   * Subscribes to a domain event type.
   * @param {string} eventType - The event type.
   * @param {(event: DomainEvent) => Promise<void>} handler - The event handler.
   */
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
  /**
   * Unsubscribes from a domain event type.
   * @param {string} eventType - The event type.
   * @param {(event: DomainEvent) => Promise<void>} handler - The event handler.
   */
  unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
} 