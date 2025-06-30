export interface ValidationRule<T> {
  validate: (_value: T) => boolean;
  message: string;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateRequired(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function validateLength(value: string, min: number, max: number): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  return value.length >= min && value.length <= max;
}

export function validateEnum<T extends string>(value: T, allowedValues: readonly T[]): boolean {
  return allowedValues.includes(value);
}

export function validateNumber(value: number, min?: number, max?: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  if (min !== undefined && value < min) {
    return false;
  }
  if (max !== undefined && value > max) {
    return false;
  }
  return true;
} 