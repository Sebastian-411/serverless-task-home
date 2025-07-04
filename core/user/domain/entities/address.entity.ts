/**
 * Address Entity
 * Represents a physical address for users
 */

import { v4 as uuidv4 } from 'uuid';

import { ValidationError } from '../../../common/domain/exceptions/validation.error';

export interface AddressData {
  id?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Address {
  public id: string;
  public addressLine1: string;
  public addressLine2: string;
  public city: string;
  public stateOrProvince: string;
  public postalCode: string;
  public country: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: AddressData = {} as AddressData) {
    this.id = data.id || uuidv4();
    this.addressLine1 = data.addressLine1 || '';
    this.addressLine2 = data.addressLine2 || '';
    this.city = data.city || '';
    this.stateOrProvince = data.stateOrProvince || '';
    this.postalCode = data.postalCode || '';
    this.country = data.country || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    
    // Validate on creation
    this.validate();
  }

  /**
   * Validation rules for Address
   */
  validate(): boolean {
    const errors: string[] = [];

    // Required fields
    if (!this.addressLine1?.trim()) {
      errors.push('Address line 1 is required');
    }

    if (!this.city?.trim()) {
      errors.push('City is required');
    }

    if (!this.stateOrProvince?.trim()) {
      errors.push('State or Province is required');
    }

    if (!this.postalCode?.trim()) {
      errors.push('Postal code is required');
    }

    if (!this.country?.trim()) {
      errors.push('Country is required');
    }

    // Length validations
    if (this.addressLine1 && this.addressLine1.length > 255) {
      errors.push('Address line 1 must be less than 255 characters');
    }

    if (this.addressLine2 && this.addressLine2.length > 255) {
      errors.push('Address line 2 must be less than 255 characters');
    }

    if (this.city && this.city.length > 100) {
      errors.push('City must be less than 100 characters');
    }

    if (this.stateOrProvince && this.stateOrProvince.length > 100) {
      errors.push('State or Province must be less than 100 characters');
    }

    // Postal code format validation (basic)
    if (this.postalCode && this.postalCode.length < 3) {
      errors.push('Postal code must be at least 3 characters');
    }

    if (this.postalCode && this.postalCode.length > 20) {
      errors.push('Postal code must be less than 20 characters');
    }

    // Country validation
    if (this.country && this.country.length < 2) {
      errors.push('Country must be at least 2 characters');
    }

    if (this.country && this.country.length > 100) {
      errors.push('Country must be less than 100 characters');
    }

    if (errors.length > 0) {
      throw new ValidationError('Address validation failed', errors);
    }

    return true;
  }

  /**
   * Factory method to create a new Address instance
   */
  static create(addressData: AddressData): Address {
    return new Address(addressData);
  }

  /**
   * Get full address as formatted string
   */
  getFullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.stateOrProvince,
      this.postalCode,
      this.country
    ].filter(part => part && part.trim());

    return parts.join(', ');
  }

  /**
   * Get address for shipping label format
   */
  getShippingFormat(): string {
    const line1 = this.addressLine1;
    const line2 = this.addressLine2 ? `\n${this.addressLine2}` : '';
    const cityStateZip = `${this.city}, ${this.stateOrProvince} ${this.postalCode}`;
    const country = this.country;

    return `${line1}${line2}\n${cityStateZip}\n${country}`;
  }

  /**
   * Check if address is in a specific country
   */
  isInCountry(countryCode: string): boolean {
    return this.country.toLowerCase() === countryCode.toLowerCase();
  }

  /**
   * Check if address appears to be international (basic check)
   */
  isInternational(homeCountry: string = 'US'): boolean {
    return !this.isInCountry(homeCountry);
  }

  /**
   * Update address fields
   */
  updateAddress(updates: Partial<AddressData>): Address {
    const allowedFields = [
      'addressLine1', 'addressLine2', 'city', 
      'stateOrProvince', 'postalCode', 'country'
    ];

    allowedFields.forEach(field => {
      if (updates[field as keyof AddressData] !== undefined) {
        (this as any)[field] = updates[field as keyof AddressData];
      }
    });

    this.updatedAt = new Date();
    this.validate();

    return this;
  }

  /**
   * Convert to plain object for JSON serialization
   */
  toJSON(): AddressData {
    return {
      id: this.id,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      stateOrProvince: this.stateOrProvince,
      postalCode: this.postalCode,
      country: this.country,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create Address from Prisma data
   */
  static fromPrisma(prismaAddress: Record<string, unknown>): Address | null {
    if (!prismaAddress) return null;

    return new Address({
      id: prismaAddress.id as string,
      addressLine1: prismaAddress.addressLine1 as string,
      addressLine2: prismaAddress.addressLine2 as string,
      city: prismaAddress.city as string,
      stateOrProvince: prismaAddress.stateOrProvince as string,
      postalCode: prismaAddress.postalCode as string,
      country: prismaAddress.country as string,
      createdAt: prismaAddress.createdAt as Date,
      updatedAt: prismaAddress.updatedAt as Date
    });
  }

  /**
   * Convert to Prisma data format
   */
  toPrisma(): Record<string, unknown> {
    return {
      id: this.id,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      stateOrProvince: this.stateOrProvince,
      postalCode: this.postalCode,
      country: this.country,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 