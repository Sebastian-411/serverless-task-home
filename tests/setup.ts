/**
 * Jest Test Setup File
 * Configures global mocks and test environment
 */

// Mock process.env for consistent testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence console.log during tests
  // log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeValidUUID(): R;
      toHaveValidUserStructure(): R;
      toBeValidEmail(): R;
      toBeValidPassword(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidDate(received) {
    const isValid = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => `expected ${received} to be a valid Date`,
      pass: isValid,
    };
  },

  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass
    };
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid email`,
      pass
    };
  },

  toBeValidPassword(received: string) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    const pass = passwordRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid password`,
      pass
    };
  },

  toHaveValidUserStructure(received) {
    const hasRequiredFields = received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      typeof received.email === 'string' &&
      typeof received.phoneNumber === 'string' &&
      ['ADMIN', 'USER'].includes(received.role) &&
      received.createdAt instanceof Date &&
      received.updatedAt instanceof Date;

    return {
      message: () => `expected ${JSON.stringify(received)} to have valid user structure`,
      pass: !!hasRequiredFields,
    };
  }
});

// Mock timers for consistent testing
beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Global test timeout
jest.setTimeout(10000);

// Test Setup Configuration
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // TODO: Setup test database
  // TODO: Initialize test dependencies
});

afterAll(async () => {
  // TODO: Cleanup test database
  // TODO: Close connections
}); 