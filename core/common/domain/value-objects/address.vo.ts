import { ValidationError } from '../exceptions/validation.error';

export interface AddressComponents {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export class Address {
  private readonly _street: string;
  private readonly _city: string;
  private readonly _state: string;
  private readonly _country: string;
  private readonly _postalCode: string;

  constructor(components: AddressComponents) {
    this._validate(components);
    this._street = this._normalize(components.street);
    this._city = this._normalize(components.city);
    this._state = this._normalize(components.state);
    this._country = this._normalize(components.country);
    this._postalCode = components.postalCode.toUpperCase().trim();
  }

  private _validate(components: AddressComponents): void {
    const { street, city, state, country, postalCode } = components;

    // Validar street
    if (!street || typeof street !== 'string') {
      throw new ValidationError('Street is required and must be a string');
    }
    if (street.trim().length < 5) {
      throw new ValidationError('Street must be at least 5 characters long');
    }
    if (street.trim().length > 200) {
      throw new ValidationError('Street must not exceed 200 characters');
    }

    // Validar city
    if (!city || typeof city !== 'string') {
      throw new ValidationError('City is required and must be a string');
    }
    if (city.trim().length < 2) {
      throw new ValidationError('City must be at least 2 characters long');
    }
    if (city.trim().length > 100) {
      throw new ValidationError('City must not exceed 100 characters');
    }

    // Validar state
    if (!state || typeof state !== 'string') {
      throw new ValidationError('State is required and must be a string');
    }
    if (state.trim().length < 2) {
      throw new ValidationError('State must be at least 2 characters long');
    }
    if (state.trim().length > 100) {
      throw new ValidationError('State must not exceed 100 characters');
    }

    // Validar country
    if (!country || typeof country !== 'string') {
      throw new ValidationError('Country is required and must be a string');
    }
    if (country.trim().length < 2) {
      throw new ValidationError('Country must be at least 2 characters long');
    }
    if (country.trim().length > 100) {
      throw new ValidationError('Country must not exceed 100 characters');
    }

    // Validar postal code
    if (!postalCode || typeof postalCode !== 'string') {
      throw new ValidationError('Postal code is required and must be a string');
    }
    if (postalCode.trim().length < 3) {
      throw new ValidationError('Postal code must be at least 3 characters long');
    }
    if (postalCode.trim().length > 20) {
      throw new ValidationError('Postal code must not exceed 20 characters');
    }
  }

  private _normalize(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  get street(): string {
    return this._street;
  }

  get city(): string {
    return this._city;
  }

  get state(): string {
    return this._state;
  }

  get country(): string {
    return this._country;
  }

  get postalCode(): string {
    return this._postalCode;
  }

  get fullAddress(): string {
    return `${this._street}, ${this._city}, ${this._state} ${this._postalCode}, ${this._country}`;
  }

  get shortAddress(): string {
    return `${this._city}, ${this._state}`;
  }

  get components(): AddressComponents {
    return {
      street: this._street,
      city: this._city,
      state: this._state,
      country: this._country,
      postalCode: this._postalCode
    };
  }

  equals(other: Address): boolean {
    return (
      this._street === other._street &&
      this._city === other._city &&
      this._state === other._state &&
      this._country === other._country &&
      this._postalCode === other._postalCode
    );
  }

  toString(): string {
    return this.fullAddress;
  }

  toJSON(): AddressComponents {
    return this.components;
  }

  static isValid(components: AddressComponents): boolean {
    try {
      new Address(components);
      return true;
    } catch {
      return false;
    }
  }

  static fromString(addressString: string): Address {
    // Parsear dirección desde string (formato básico)
    const parts = addressString.split(',').map(part => part.trim());
    
    if (parts.length < 4) {
      throw new ValidationError('Invalid address format. Expected: street, city, state postalCode, country');
    }

    const street = parts[0];
    const city = parts[1];
    const statePostal = parts[2].split(' ');
    const state = statePostal[0];
    const postalCode = statePostal[1] || '';
    const country = parts[3];

    return new Address({ street, city, state, country, postalCode });
  }
} 