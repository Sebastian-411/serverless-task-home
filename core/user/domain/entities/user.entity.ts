/**
 * User Entity - TypeScript ES Module Version
 * Data model for system users with complete validation and business logic
 */

import { BaseEntity } from '../../../common/domain/base.entity';
import { ValidationError } from '../../../common/domain/exceptions/validation.error';

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface UserData {
  id?: string;
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phoneNumber?: string;
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
  id?: string;
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

export class User extends BaseEntity {
  private _email: string;
  private _password: string;
  private _name: string;
  private _role: UserRole;
  private _phoneNumber?: string;
  private _address?: Address;
  private _isActive: boolean;
  private _emailVerified: boolean;
  private _lastLoginAt?: string;

  constructor(userData: UserData) {
    super(userData.id);
    
    this._validateEmail(userData.email);
    this._validatePassword(userData.password);
    this._validateName(userData.name, 'name');
    this._validateRole(userData.role);
    
    this._email = userData.email.toLowerCase().trim();
    this._password = userData.password;
    this._name = userData.name.trim();
    this._role = userData.role || UserRole.USER;
    this._phoneNumber = userData.phoneNumber;
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

  get name(): string {
    return this._name;
  }

  get role(): UserRole {
    return this._role;
  }

  get phoneNumber(): string | undefined {
    return this._phoneNumber;
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

  setName(name: string): void {
    this._validateName(name, 'name');
    this._name = name.trim();
    this.updateTimestamp();
  }

  setRole(role: UserRole): void {
    this._validateRole(role);
    this._role = role;
    this.updateTimestamp();
  }

  setPhoneNumber(phoneNumber: string): void {
    this._validatePhoneNumber(phoneNumber);
    this._phoneNumber = phoneNumber;
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
    this._lastLoginAt = lastLoginAt;
    this.updateTimestamp();
  }

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

  // Private validation methods
  protected _validateEmail(email: string): void {
    if (!email || !User.isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  protected _validatePassword(password: string): void {
    if (!password || !User.isValidPassword(password)) {
      throw new ValidationError('Password must be at least 8 characters with uppercase, lowercase, and number');
    }
  }

  protected _validateName(name: string, fieldName: string): void {
    if (!name || name.trim().length < 1 || name.trim().length > 50) {
      throw new ValidationError(`${fieldName} must be between 1 and 50 characters`);
    }
  }

  protected _validateRole(role?: UserRole): void {
    if (role && !Object.values(UserRole).includes(role)) {
      throw new ValidationError('Invalid user role');
    }
  }

  protected _validatePhoneNumber(phoneNumber: string): void {
    if (phoneNumber && phoneNumber.trim().length < 10) {
      throw new ValidationError('Phone number must be at least 10 characters');
    }
  }

  equals(other: BaseEntity): boolean {
    if (!(other instanceof User)) {
      return false;
    }
    return this._email === other._email;
  }

  hasSameEmail(other: User): boolean {
    return this._email === other._email;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      email: this._email,
      name: this._name,
      role: this._role,
      phoneNumber: this._phoneNumber,
      address: this._address,
      isActive: this._isActive,
      emailVerified: this._emailVerified,
      lastLoginAt: this._lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  toSafeJSON(): Record<string, unknown> {
    return {
      id: this.id,
      email: this._email,
      name: this._name,
      role: this._role,
      phoneNumber: this._phoneNumber,
      address: this._address,
      isActive: this._isActive,
      emailVerified: this._emailVerified,
      lastLoginAt: this._lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate(): void {
    this._validateEmail(this._email);
    this._validatePassword(this._password);
    this._validateName(this._name, 'name');
    this._validateRole(this._role);
    if (this._phoneNumber) {
      this._validatePhoneNumber(this._phoneNumber);
    }
  }

  // Static factory methods
  static create(data: UserData): User {
    return new User(data);
  }

  static createAdmin(data: Omit<UserData, 'role'>): User {
    return new User({ ...data, role: UserRole.ADMIN });
  }

  // Static validation methods
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  static isValidPassword(password: string): boolean {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }

  // Static utility methods
  static normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static normalizeName(name: string): string {
    return name.trim();
  }
} 