import { BaseEntity } from '../base.entity';
import { ValidationError } from '../exceptions/validation.error';

export class PhoneVO extends BaseEntity {
  private readonly _value: string;
  private readonly _countryCode: string;
  private readonly _areaCode: string;
  private readonly _number: string;

  /**
   * Constructs a new PhoneVO value object, validating and normalizing the input.
   *
   * @param {string} value - The phone number string.
   * @throws {ValidationError} If the value is missing or invalid.
   */
  constructor(value: string) {
    console.log('[PhoneVO][constructor] Creating PhoneVO value object', { value });
    super();
    this._value = this._normalizePhone(value);
    this._validatePhone(this._value);
    
    const parts = this._parsePhone(this._value);
    this._countryCode = parts.countryCode;
    this._areaCode = parts.areaCode;
    this._number = parts.number;
  }

  /**
   * Gets the normalized phone value.
   *
   * @returns {string} The normalized phone number.
   */
  get value(): string {
    console.log('[PhoneVO][value] Getting phone value', { value: this._value });
    return this._value;
  }

  /**
   * Gets the country code part of the phone number.
   *
   * @returns {string} The country code.
   */
  get countryCode(): string {
    return this._countryCode;
  }

  /**
   * Gets the area code part of the phone number.
   *
   * @returns {string} The area code.
   */
  get areaCode(): string {
    return this._areaCode;
  }

  /**
   * Gets the local number part of the phone number.
   *
   * @returns {string} The local number.
   */
  get number(): string {
    return this._number;
  }

  /**
   * Gets the formatted phone number in international format.
   *
   * @returns {string} The formatted phone number.
   */
  get formatted(): string {
    return `+${this._countryCode} (${this._areaCode}) ${this._number}`;
  }

  /**
   * Gets the phone number in compact international format.
   *
   * @returns {string} The international phone number.
   */
  get international(): string {
    return `+${this._countryCode}${this._areaCode}${this._number}`;
  }

  /**
   * Gets the phone number in national format.
   *
   * @returns {string} The national phone number.
   */
  get national(): string {
    return `${this._areaCode}${this._number}`;
  }

  /**
   * Normalizes the phone number by removing non-numeric characters except '+'.
   *
   * @param {string} phone - The phone number to normalize.
   * @returns {string} The normalized phone number.
   */
  private _normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Validates the phone number format and length.
   *
   * @param {string} phone - The phone number to validate.
   * @throws {ValidationError} If the phone number is invalid.
   */
  private _validatePhone(phone: string): void {
    const internationalRegex = /^\+[1-9]\d{1,14}$/;
    if (!internationalRegex.test(phone)) {
      console.warn('[PhoneVO][_validatePhone] Validation failed: Invalid international format', { phone });
      throw new ValidationError('Phone number must be in international format (+[country code][number])');
    }
    if (phone.length < 8 || phone.length > 16) {
      console.warn('[PhoneVO][_validatePhone] Validation failed: Invalid length', { phone });
      throw new ValidationError('Phone number must be between 7 and 15 digits');
    }
  }

  /**
   * Parses the phone number into country code, area code, and number.
   *
   * @param {string} phone - The normalized phone number.
   * @returns {{ countryCode: string; areaCode: string; number: string }} The parsed parts.
   */
  private _parsePhone(phone: string): { countryCode: string; areaCode: string; number: string } {
    const number = phone.substring(1);
    let countryCode: string;
    let areaCode: string;
    let phoneNumber: string;

    if (number.startsWith('1')) {
      // Estados Unidos/Canadá
      countryCode = '1';
      areaCode = number.substring(1, 4);
      phoneNumber = number.substring(4);
    } else if (number.startsWith('44')) {
      // Reino Unido
      countryCode = '44';
      areaCode = number.substring(2, 5);
      phoneNumber = number.substring(5);
    } else if (number.startsWith('34')) {
      // España
      countryCode = '34';
      areaCode = number.substring(2, 4);
      phoneNumber = number.substring(4);
    } else if (number.startsWith('52')) {
      // México
      countryCode = '52';
      areaCode = number.substring(2, 5);
      phoneNumber = number.substring(5);
    } else {
      // Otros países - asumir código de país de 2-3 dígitos
      const countryCodeLength = number.startsWith('33') || number.startsWith('49') || number.startsWith('39') ? 2 : 3;
      countryCode = number.substring(0, countryCodeLength);
      areaCode = number.substring(countryCodeLength, countryCodeLength + 3);
      phoneNumber = number.substring(countryCodeLength + 3);
    }

    return {
      countryCode,
      areaCode,
      number: phoneNumber
    };
  }

  /**
   * Compares this PhoneVO value object to another for equality.
   *
   * @param {PhoneVO} other - The other PhoneVO value object.
   * @returns {boolean} True if the phone numbers are equal, false otherwise.
   */
  equals(other: PhoneVO): boolean {
    const isEqual = this._value === other._value;
    console.log('[PhoneVO][equals] Comparing phone numbers', { thisValue: this._value, otherValue: other?._value, isEqual });
    return isEqual;
  }

  /**
   * Returns the string representation of the phone number.
   *
   * @returns {string} The phone number.
   */
  toString(): string {
    return this._value;
  }

  /**
   * Returns the JSON representation of the phone number.
   *
   * @returns {Record<string, unknown>} The phone number and parsed parts.
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      value: this._value,
      countryCode: this._countryCode,
      areaCode: this._areaCode,
      number: this._number,
      formatted: this.formatted,
      international: this.international,
      national: this.national
    };
  }

  /**
   * Validates the phone number value.
   *
   * @throws {ValidationError} If the phone number is invalid.
   */
  validate(): void {
    try {
      this._validatePhone(this._value);
    } catch (error) {
      console.error('[PhoneVO][validate] Validation failed', { value: this._value, error });
      throw error;
    }
  }

  /**
   * Checks if a string is a valid phone number.
   *
   * @param {string} phone - The phone number to validate.
   * @returns {boolean} True if valid, false otherwise.
   */
  static isValid(phone: string): boolean {
    try {
      new PhoneVO(phone);
      return true;
    } catch (error) {
      console.warn('[PhoneVO][isValid] Validation failed', { phone, error });
      return false;
    }
  }

  /**
   * Normalizes a phone number by removing non-numeric characters except '+'.
   *
   * @param {string} phone - The phone number to normalize.
   * @returns {string} The normalized phone number.
   */
  static normalize(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Extracts the country code from a phone number.
   *
   * @param {string} phone - The phone number.
   * @returns {string | null} The country code or null if invalid.
   */
  static getCountryCode(phone: string): string | null {
    try {
      const phoneVO = new PhoneVO(phone);
      return phoneVO.countryCode;
    } catch (error) {
      console.warn('[PhoneVO][getCountryCode] Validation failed', { phone, error });
      return null;
    }
  }

  /**
   * Extracts the area code from a phone number.
   *
   * @param {string} phone - The phone number.
   * @returns {string | null} The area code or null if invalid.
   */
  static getAreaCode(phone: string): string | null {
    try {
      const phoneVO = new PhoneVO(phone);
      return phoneVO.areaCode;
    } catch (error) {
      console.warn('[PhoneVO][getAreaCode] Validation failed', { phone, error });
      return null;
    }
  }

  /**
   * Formats a phone number in international format.
   *
   * @param {string} phone - The phone number.
   * @returns {string | null} The formatted phone number or null if invalid.
   */
  static format(phone: string): string | null {
    try {
      const phoneVO = new PhoneVO(phone);
      return phoneVO.formatted;
    } catch (error) {
      console.warn('[PhoneVO][format] Validation failed', { phone, error });
      return null;
    }
  }
} 