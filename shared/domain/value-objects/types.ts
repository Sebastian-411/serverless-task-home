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

// Tipos para caché
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// Tipos para autenticación
export interface IAuthService {
  authenticate(token: string): Promise<AuthUser | null>;
  authorize(userId: string, resource: string, action: string): Promise<boolean>;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

// Tipos para logging
export interface ILogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

// Tipos para métricas
export interface IMetricsService {
  increment(counter: string, value?: number, tags?: Record<string, string>): void;
  gauge(gauge: string, value: number, tags?: Record<string, string>): void;
  timer(timer: string, duration: number, tags?: Record<string, string>): void;
  histogram(histogram: string, value: number, tags?: Record<string, string>): void;
}

// Tipos para rate limiting
export interface IRateLimiter {
  isAllowed(key: string, limit: number, window: number): Promise<boolean>;
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
}

// Tipos para encriptación
export interface IEncryptionService {
  encrypt(data: string): Promise<string>;
  decrypt(encryptedData: string): Promise<string>;
  hash(data: string): Promise<string>;
  verify(data: string, hash: string): Promise<boolean>;
}

// Tipos para notificaciones
export interface INotificationService {
  send(notification: Notification): Promise<void>;
  sendBatch(notifications: Notification[]): Promise<void>;
}

export interface Notification {
  type: string;
  recipient: string;
  subject: string;
  content: string;
  metadata?: Record<string, unknown>;
}

// Tipos para archivos
export interface IFileService {
  upload(file: File): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

// Tipos para búsqueda
export interface ISearchService<TEntity> {
  index(entity: TEntity): Promise<void>;
  search(query: string, options?: QueryOptions<TEntity>): Promise<PaginationResult<TEntity>>;
  delete(id: string): Promise<void>;
} 