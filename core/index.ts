// Core Module - Arquitectura Hexagonal
// Este archivo exporta todos los módulos del core

// Common Domain
export * from './common/domain';

// Auth Module
export * from './auth/domain';
export * from './auth/application';
export * from './auth/infrastructure';

// User Module
export {
  User,
  UserData,
  CreateUserData,
  UpdateUserData,
  Address as UserAddress,
  UserRole as UserUserRole,
  UserRole
} from './user/domain';
export * from './user/application';
export * from './user/infrastructure';

