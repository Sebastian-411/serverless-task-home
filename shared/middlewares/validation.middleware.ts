import { VercelRequest } from '@vercel/node';

export interface ValidationResult {
  success: boolean;
  data?: any;
  response?: {
    status: number;
    body: any;
  };
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'email' | 'uuid' | 'number';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  errorMessage?: string;
}

export class ValidationMiddleware {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Ultra-fast validation using precompiled rules - O(n) where n = number of rules
   * Single Responsibility: Validate request data only
   */
  static validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = data[rule.field];

      // Required field check - O(1)
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(rule.errorMessage || `${rule.field} is required`);
        continue;
      }

      // Skip further validation if field is empty and not required
      if (!value) continue;

      // Type validation - O(1)
      if (rule.type) {
        if (!this.validateType(value, rule.type)) {
          errors.push(rule.errorMessage || `${rule.field} must be a valid ${rule.type}`);
          continue;
        }
      }

      // Length validation - O(1)
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(rule.errorMessage || `${rule.field} must be at least ${rule.minLength} characters`);
        continue;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(rule.errorMessage || `${rule.field} must be at most ${rule.maxLength} characters`);
        continue;
      }

      // Pattern validation - O(m) where m = pattern complexity
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.errorMessage || `${rule.field} format is invalid`);
        continue;
      }

      // Custom validation - O(k) where k = custom function complexity
      if (rule.customValidator && !rule.customValidator(value)) {
        errors.push(rule.errorMessage || `${rule.field} is invalid`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        response: {
          status: 400,
          body: {
            error: 'Validation error',
            message: errors[0], // Return first error for consistency
            details: errors
          }
        }
      };
    }

    return { success: true, data };
  }

  /**
   * Optimized type validation - O(1)
   */
  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'email':
        return typeof value === 'string' && this.EMAIL_REGEX.test(value);
      case 'uuid':
        return typeof value === 'string' && this.UUID_REGEX.test(value);
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      default:
        return true;
    }
  }

  /**
   * Fast method validation - O(1)
   */
  static validateMethod(req: VercelRequest, allowedMethods: string[]): ValidationResult {
    if (!allowedMethods.includes(req.method || '')) {
      return {
        success: false,
        response: {
          status: 405,
          body: {
            error: 'Method not allowed',
            message: `Only ${allowedMethods.join(', ')} methods are allowed`
          }
        }
      };
    }
    return { success: true };
  }

  /**
   * Fast path parameter validation - O(1)
   */
  static validatePathParam(req: VercelRequest, paramName: string, type: 'uuid' | 'string' = 'string'): ValidationResult {
    const value = req.query[paramName];
    
    if (!value || typeof value !== 'string') {
      return {
        success: false,
        response: {
          status: 400,
          body: {
            error: 'Validation error',
            message: `Valid ${paramName} is required`
          }
        }
      };
    }

    if (type === 'uuid' && !this.UUID_REGEX.test(value)) {
      return {
        success: false,
        response: {
          status: 400,
          body: {
            error: 'Validation error',
            message: `${paramName} must be a valid UUID`
          }
        }
      };
    }

    return { success: true, data: value };
  }
} 