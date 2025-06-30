import { BaseEntity } from '../base.entity';
import { ValidationError } from '../exceptions/validation.error';

export class PhoneVO extends BaseEntity {
  private readonly _value: string;
  private readonly _countryCode: string;
  private readonly _areaCode: string;
  private readonly _number: string;

  constructor(value: string) {
    super();
    this._value = this._normalizePhone(value);
    this._validatePhone(this._value);
    
    const parts = this._parsePhone(this._value);
    this._countryCode = parts.countryCode;
    this._areaCode = parts.areaCode;
    this._number = parts.number;
  }

  get value(): string {
    return this._value;
  }

  get countryCode(): string {
    return this._countryCode;
  }

  get areaCode(): string {
    return this._areaCode;
  }

  get number(): string {
    return this._number;
  }

  get formatted(): string {
    return `+${this._countryCode} (${this._areaCode}) ${this._number}`;
  }

  get international(): string {
    return `+${this._countryCode}${this._areaCode}${this._number}`;
  }

  get national(): string {
    return `${this._areaCode}${this._number}`;
  }

  private _normalizePhone(phone: string): string {
    // Eliminar todos los caracteres no numéricos excepto el +
    return phone.replace(/[^\d+]/g, '');
  }

  private _validatePhone(phone: string): void {
    // Validar formato internacional: +[código país][número]
    const internationalRegex = /^\+[1-9]\d{1,14}$/;
    
    if (!internationalRegex.test(phone)) {
      throw new ValidationError('Phone number must be in international format (+[country code][number])');
    }

    // Validar longitud total (incluyendo el +)
    if (phone.length < 8 || phone.length > 16) {
      throw new ValidationError('Phone number must be between 7 and 15 digits');
    }
  }

  private _parsePhone(phone: string): { countryCode: string; areaCode: string; number: string } {
    // Remover el + del inicio
    const number = phone.substring(1);
    
    // Detectar código de país basado en patrones comunes
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

  equals(other: PhoneVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

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

  validate(): void {
    this._validatePhone(this._value);
  }

  // Métodos estáticos para validación
  static isValid(phone: string): boolean {
    try {
      new PhoneVO(phone);
      return true;
    } catch {
      return false;
    }
  }

  static normalize(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  static getCountryCode(phone: string): string | null {
    try {
      const phoneVO = new PhoneVO(phone);
      return phoneVO.countryCode;
    } catch {
      return null;
    }
  }

  static getAreaCode(phone: string): string | null {
    try {
      const phoneVO = new PhoneVO(phone);
      return phoneVO.areaCode;
    } catch {
      return null;
    }
  }

  static format(phone: string): string | null {
    try {
      const phoneVO = new PhoneVO(phone);
      return phoneVO.formatted;
    } catch {
      return null;
    }
  }
} 