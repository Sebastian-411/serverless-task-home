/**
 * User Entity - TypeScript ES Module Version
 * Data model for system users with complete validation and business logic
 */

import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '../../../shared/domain/base.entity';
import { ValidationError } from '../../../shared/domain/exceptions/validation.error';
import { Email } from '../../../shared/domain/value-objects/email.vo';
import { Name } from '../../../shared/domain/value-objects/name.vo';
import { Password } from '../../../shared/domain/value-objects/password.vo';
import { Phone } from '../../../shared/domain/value-objects/phone.vo';

import type { Address } from './address.entity';
import { UserRepository } from './user.repository';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface UserData {
  id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phone?: string;
  address?: Address;
  isActive?: boolean;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  phoneNumber: string;
  address?: AddressData;
  role?: 'ADMIN' | 'USER';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: AddressData;
  role?: 'ADMIN' | 'USER';
}

// Repository interface for dependency injection
export interface UserRepository {
  create(userData: any): Promise<UserData>;
  findById(id: string): Promise<UserData | null>;
  findByEmail(email: string): Promise<UserData | null>;
  findAll(): Promise<UserData[]>;
  update(id: string, data: any): Promise<UserData>;
  delete(id: string): Promise<void>;
}

export class User extends BaseEntity {
  private _email: string;
  private _password: string;
  private _firstName: string;
  private _lastName: string;
  private _role: UserRole;
  private _phone?: string;
  private _address?: Address;
  private _isActive: boolean;
  private _emailVerified: boolean;
  private _lastLoginAt?: string;

  constructor(userData: UserData) {
    super(userData.id);
    
    this._validateEmail(userData.email);
    this._validatePassword(userData.password);
    this._validateName(userData.firstName, 'firstName');
    this._validateName(userData.lastName, 'lastName');
    this._validateRole(userData.role);
    
    this._email = userData.email.toLowerCase().trim();
    this._password = userData.password;
    this._firstName = userData.firstName.trim();
    this._lastName = userData.lastName.trim();
    this._role = userData.role || UserRole.USER;
    this._phone = userData.phone;
    this._address = userData.address;
    this._isActive = userData.isActive ?? true;
    this._emailVerified = userData.emailVerified ?? false;
    this._lastLoginAt = userData.lastLoginAt;
  }

  // Getters
  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  get role(): UserRole {
    return this._role;
  }

  get phone(): string | undefined {
    return this._phone;
  }

  get address(): Address | undefined {
    return this._address;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get lastLoginAt(): string | undefined {
    return this._lastLoginAt;
  }

  get isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  // Setters con validación
  setEmail(email: string): void {
    this._validateEmail(email);
    this._email = email.toLowerCase().trim();
    this.updateTimestamp();
  }

  setPassword(password: string): void {
    this._validatePassword(password);
    this._password = password;
    this.updateTimestamp();
  }

  setFirstName(firstName: string): void {
    this._validateName(firstName, 'firstName');
    this._firstName = firstName.trim();
    this.updateTimestamp();
  }

  setLastName(lastName: string): void {
    this._validateName(lastName, 'lastName');
    this._lastName = lastName.trim();
    this.updateTimestamp();
  }

  setRole(role: UserRole): void {
    this._validateRole(role);
    this._role = role;
    this.updateTimestamp();
  }

  setPhone(phone: string): void {
    this._validatePhone(phone);
    this._phone = phone;
    this.updateTimestamp();
  }

  setAddress(address: Address): void {
    this._address = address;
    this.updateTimestamp();
  }

  setActive(isActive: boolean): void {
    this._isActive = isActive;
    this.updateTimestamp();
  }

  setEmailVerified(emailVerified: boolean): void {
    this._emailVerified = emailVerified;
    this.updateTimestamp();
  }

  setLastLoginAt(lastLoginAt: string): void {
    this._validateTimestamp(lastLoginAt, 'lastLoginAt');
    this._lastLoginAt = lastLoginAt;
    this.updateTimestamp();
  }

  // Métodos de negocio
  updateLastLogin(): void {
    this._lastLoginAt = new Date().toISOString();
    this.updateTimestamp();
  }

  activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this._isActive = false;
    this.updateTimestamp();
  }

  verifyEmail(): void {
    this._emailVerified = true;
    this.updateTimestamp();
  }

  promoteToAdmin(): void {
    this._role = UserRole.ADMIN;
    this.updateTimestamp();
  }

  demoteToUser(): void {
    this._role = UserRole.USER;
    this.updateTimestamp();
  }

  // Validaciones privadas
  private _validateEmail(email: string): void {
    this._validateRequired(email, 'email');
    this._validateLength(email, 5, 254, 'email');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Email must be a valid email address');
    }
  }

  private _validatePassword(password: string): void {
    this._validateRequired(password, 'password');
    this._validateLength(password, 8, 128, 'password');
    
    // Validar complejidad de contraseña
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new ValidationError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
  }

  private _validateName(name: string, fieldName: string): void {
    this._validateRequired(name, fieldName);
    this._validateLength(name, 2, 50, fieldName);
    
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    if (!nameRegex.test(name)) {
      throw new ValidationError(`${fieldName} must contain only letters, spaces, hyphens, and apostrophes`);
    }
  }

  private _validateRole(role?: UserRole): void {
    if (role && !Object.values(UserRole).includes(role)) {
      throw new ValidationError(`Role must be one of: ${Object.values(UserRole).join(', ')}`);
    }
  }

  private _validatePhone(phone: string): void {
    if (phone) {
      this._validateLength(phone, 10, 15, 'phone');
      
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      if (!phoneRegex.test(phone)) {
        throw new ValidationError('Phone must contain only digits, spaces, hyphens, parentheses, and optionally a plus sign');
      }
    }
  }

  // Métodos de comparación
  equals(other: User): boolean {
    return this.id === other.id;
  }

  hasSameEmail(other: User): boolean {
    return this._email === other._email;
  }

  // Métodos de serialización
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      email: this._email,
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
      role: this._role,
      phone: this._phone,
      address: this._address?.toJSON(),
      isActive: this._isActive,
      emailVerified: this._emailVerified,
      lastLoginAt: this._lastLoginAt,
      isAdmin: this.isAdmin
    };
  }

  toSafeJSON(): Record<string, unknown> {
    return {
      id: this.id,
      email: this._email,
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
      role: this._role,
      phone: this._phone,
      address: this._address?.toJSON(),
      isActive: this._isActive,
      emailVerified: this._emailVerified,
      lastLoginAt: this._lastLoginAt,
      isAdmin: this.isAdmin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Método de validación requerido por BaseEntity
  validate(): void {
    this._validateEmail(this._email);
    this._validatePassword(this._password);
    this._validateName(this._firstName, 'firstName');
    this._validateName(this._lastName, 'lastName');
    this._validateRole(this._role);
    
    if (this._phone) {
      this._validatePhone(this._phone);
    }
    
    if (this._address) {
      this._address.validate();
    }
    
    if (this._lastLoginAt) {
      this._validateTimestamp(this._lastLoginAt, 'lastLoginAt');
    }
  }

  // Métodos estáticos
  static create(data: UserData): User {
    return new User(data);
  }

  static createAdmin(data: Omit<UserData, 'role'>): User {
    return new User({ ...data, role: UserRole.ADMIN });
  }

  static isValidEmail(email: string): boolean {
    try {
      const user = new User({ email, password: 'TempPass123!', firstName: 'Test', lastName: 'User' });
      return true;
    } catch {
      return false;
    }
  }

  static isValidPassword(password: string): boolean {
    try {
      const user = new User({ email: 'test@example.com', password, firstName: 'Test', lastName: 'User' });
      return true;
    } catch {
      return false;
    }
  }

  static normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }
} 