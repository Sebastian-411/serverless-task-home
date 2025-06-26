const { v4: uuidv4 } = require('uuid');
const BaseModel = require('./BaseModel');
const ValidationError = require('./ValidationError');

/**
 * Address Model
 * Represents a physical address for users
 */
class Address extends BaseModel {
  constructor(data = {}) {
    super();
    
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
  validate() {
    const errors = [];

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
    if (this.addressLine1 && this.addressLine1.length > 100) {
      errors.push('Address line 1 must be less than 100 characters');
    }

    if (this.addressLine2 && this.addressLine2.length > 100) {
      errors.push('Address line 2 must be less than 100 characters');
    }

    if (this.city && this.city.length > 50) {
      errors.push('City must be less than 50 characters');
    }

    if (this.stateOrProvince && this.stateOrProvince.length > 50) {
      errors.push('State or Province must be less than 50 characters');
    }

    // Postal code format validation (basic)
    if (this.postalCode && !/^[A-Za-z0-9\s\-]{3,10}$/.test(this.postalCode)) {
      errors.push('Postal code format is invalid');
    }

    // Country code validation (ISO 3166-1 alpha-2 or full name)
    if (this.country && this.country.length < 2) {
      errors.push('Country must be at least 2 characters');
    }

    if (this.country && this.country.length > 50) {
      errors.push('Country must be less than 50 characters');
    }

    if (errors.length > 0) {
      throw new ValidationError('Address validation failed', errors);
    }

    return true;
  }

  /**
   * Factory method to create a new Address instance
   */
  static create(addressData) {
    return new Address(addressData);
  }

  /**
   * Get full address as formatted string
   */
  getFullAddress() {
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
  getShippingFormat() {
    const line1 = this.addressLine1;
    const line2 = this.addressLine2 ? `\n${this.addressLine2}` : '';
    const cityStateZip = `${this.city}, ${this.stateOrProvince} ${this.postalCode}`;
    const country = this.country;

    return `${line1}${line2}\n${cityStateZip}\n${country}`;
  }

  /**
   * Check if address is in a specific country
   */
  isInCountry(countryCode) {
    return this.country.toLowerCase() === countryCode.toLowerCase();
  }

  /**
   * Check if address appears to be international (basic check)
   */
  isInternational(homeCountry = 'US') {
    return !this.isInCountry(homeCountry);
  }

  /**
   * Update address fields
   */
  updateAddress(updates) {
    const allowedFields = [
      'addressLine1', 'addressLine2', 'city', 
      'stateOrProvince', 'postalCode', 'country'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    });

    this.updatedAt = new Date();
    this.validate();

    return this;
  }

  /**
   * Convert to plain object for JSON serialization
   */
  toJSON() {
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
  static fromPrisma(prismaAddress) {
    if (!prismaAddress) return null;

    return new Address({
      id: prismaAddress.id,
      addressLine1: prismaAddress.addressLine1,
      addressLine2: prismaAddress.addressLine2,
      city: prismaAddress.city,
      stateOrProvince: prismaAddress.stateOrProvince,
      postalCode: prismaAddress.postalCode,
      country: prismaAddress.country,
      createdAt: prismaAddress.createdAt,
      updatedAt: prismaAddress.updatedAt
    });
  }

  /**
   * Convert to Prisma format for database operations
   */
  toPrisma() {
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

module.exports = Address; 