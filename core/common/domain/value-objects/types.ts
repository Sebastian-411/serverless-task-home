// Branded types para mayor seguridad de tipos
export type Brand<T, B> = T & { __brand: B };

// Tipos con marca para IDs
export type UserId = Brand<string, 'UserId'>;

// Tipos para estados y roles
export type UserRole = 'user' | 'admin';

// Tipos para validación
export type ValidationResult<T> = {
  isValid: boolean;
  value?: T;
  errors: string[];
};

// Tipos para operaciones de dominio
export type DomainEvent<T = unknown> = {
  id: string;
  type: string;
  data: T;
  timestamp: string;
  version: number;
};

// Tipos para resultados de operaciones
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Tipos para paginación
export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

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
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';

export type FilterCondition<T = unknown> = {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
};

export type FilterGroup<T = unknown> = {
  operator: 'AND' | 'OR';
  conditions: (FilterCondition<T> | FilterGroup<T>)[];
};

export type Filters<T = unknown> = FilterGroup<T>;

// Tipos para ordenamiento
export type SortOrder = 'asc' | 'desc';

export type SortField<T = unknown> = {
  field: keyof T;
  order: SortOrder;
};

export type SortOptions<T = unknown> = SortField<T>[];

// Tipos para consultas
export type QueryOptions<T = unknown> = {
  filters?: Filters<T>;
  sort?: SortOptions<T>;
  pagination?: PaginationParams;
  include?: (keyof T)[];
  select?: (keyof T)[];
};

// Tipos para DTOs
export type CreateDTO<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDTO<T> = Partial<CreateDTO<T>>;
export type ResponseDTO<T> = T;

// Tipos para mapeo
export type EntityToDTO<TEntity, TDTO> = (entity: TEntity) => TDTO;
export type DTOToEntity<TDTO, TEntity> = (dto: TDTO) => TEntity;

// Tipos para repositorios genéricos
export interface IRepository<TEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(options?: QueryOptions<TEntity>): Promise<PaginationResult<TEntity>>;
  create(data: CreateDTO<TEntity>): Promise<TEntity>;
  update(id: TId, data: UpdateDTO<TEntity>): Promise<TEntity>;
  delete(id: TId): Promise<void>;
  exists(id: TId): Promise<boolean>;
  count(filters?: Filters<TEntity>): Promise<number>;
}

// Tipos para servicios de dominio
export interface IDomainService<TEntity, TId = string> {
  validate(entity: TEntity): ValidationResult<TEntity>;
  process(entity: TEntity): Promise<TEntity>;
  transform(entity: TEntity): unknown;
}

// Tipos para eventos de dominio
export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
  unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
} 