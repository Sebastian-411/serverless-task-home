/**
 * User Entity - TypeScript ES Module Version
 * Data model for system users with complete validation and business logic
 */

import { v4 as uuidv4 } from 'uuid';

// User-related interfaces and types
export interface UserData {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address?: AddressData | null;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
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

// Basic validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^[\+]?[0-9\s\-\(\)]{10,20}$/;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class User {
  public id!: string;
  public name!: string;
  public email!: string;
  public phoneNumber!: string;
  public address!: AddressData | null;
  public role!: 'ADMIN' | 'USER';
  public createdAt!: Date;
  public updatedAt!: Date;

  constructor(userData: UserData) {
    this._setId(userData.id);
    this._setName(userData.name);
    this._setEmail(userData.email);
    this._setPhoneNumber(userData.phoneNumber);
    this._setAddress(userData.address);
    this._setRole(userData.role);
    this._setTimestamps(userData.createdAt, userData.updatedAt);
  }

  /**
   * Factory method to create a new user
   */
     static create(userData: CreateUserData): User {
     const now = new Date();
     return new User({
       id: uuidv4(),
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      address: userData.address || null,
      role: userData.role || 'USER',
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Factory method to create user from existing data
   */
  static fromObject(userData: UserData): User {
    return new User(userData);
  }

  private _setId(id: string): void {
    if (!id || !UUID_REGEX.test(id)) {
      throw new ValidationError('Invalid user ID format');
    }
    this.id = id;
  }

  private _setName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Name is required');
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      throw new ValidationError('Name must be between 1 and 100 characters');
    }
    this.name = trimmedName;
  }

  private _setEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      throw new ValidationError('Invalid email format');
    }
    if (trimmedEmail.length > 255) {
      throw new ValidationError('Email must be less than 255 characters');
    }
    this.email = trimmedEmail;
  }

  private _setPhoneNumber(phoneNumber: string): void {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new ValidationError('Phone number is required');
    }
    const trimmedPhone = phoneNumber.trim();
    if (!PHONE_REGEX.test(trimmedPhone)) {
      throw new ValidationError('Invalid phone number format');
    }
    this.phoneNumber = trimmedPhone;
  }

  private _setAddress(address: AddressData | null | undefined): void {
    this.address = address || null;
  }

  private _setRole(role: 'ADMIN' | 'USER'): void {
    if (!role || !['ADMIN', 'USER'].includes(role)) {
      throw new ValidationError('Invalid role. Must be ADMIN or USER');
    }
    this.role = role;
  }

  private _setTimestamps(createdAt: Date, updatedAt: Date): void {
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  }

  /**
   * Validates the entire user model
   */
  validate(): boolean {
    return true; // All validation is done in setters
  }

  /**
   * Checks if user is an administrator
   */
  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  /**
   * Checks if user is a regular user
   */
  isRegularUser(): boolean {
    return this.role === 'USER';
  }

  /**
   * Updates user information
   */
  update(updates: UpdateUserData): User {
    if (updates.name !== undefined) this._setName(updates.name);
    if (updates.email !== undefined) this._setEmail(updates.email);
    if (updates.phoneNumber !== undefined) this._setPhoneNumber(updates.phoneNumber);
    if (updates.address !== undefined) this._setAddress(updates.address);
    if (updates.role !== undefined) this._setRole(updates.role);
    
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Converts model to plain object
   */
  toJSON(): UserData {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      address: this.address,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Converts to safe object (without sensitive data)
   */
  toSafeObject(): Omit<UserData, 'email'> {
    return {
      id: this.id,
      name: this.name,
      phoneNumber: this.phoneNumber,
      address: this.address,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Creates User instance from Prisma result
   */
  static fromPrisma(prismaUser: any): User {
    const userData: UserData = {
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      phoneNumber: prismaUser.phoneNumber,
      role: prismaUser.role,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      address: null
    };

    if (prismaUser.address) {
      userData.address = {
        addressLine1: prismaUser.address.addressLine1,
        addressLine2: prismaUser.address.addressLine2 || undefined,
        city: prismaUser.address.city,
        stateOrProvince: prismaUser.address.stateOrProvince,
        postalCode: prismaUser.address.postalCode,
        country: prismaUser.address.country
      };
    }

    return new User(userData);
  }

  /**
   * Converts to Prisma format for database operations
   */
  toPrisma(): any {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      address: this.address ? {
        create: this.address
      } : undefined
    };
  }
} 