/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit', '<rootDir>/core', '<rootDir>/api', '<rootDir>/shared'],
  testMatch: [
    '**/tests/unit/**/*.+(test|spec).+(ts|tsx|js)',
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    // Include all core modules for comprehensive testing coverage
    'core/**/*.{ts,tsx}',
    // Include shared services
    'shared/**/*.{ts,tsx}',
    // Include API endpoints
    'api/**/*.{ts,tsx}',
    // Exclusions
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/generated/**',
    '!**/tests/**',
    '!**/dist/**',
    '!**/coverage/**',
    // Exclude problematic files with require() statements (CommonJS conflicts)
    '!core/user/domain/address.entity.ts',
    '!core/task/domain/task.entity.ts',
    '!core/task/application/create-task.usecase.ts',
    '!core/task/application/assign-task.usecase.ts',
    '!core/task/infrastructure/task.repository.prisma.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'text-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 95,
      lines: 85,
      statements: 85
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  verbose: true
}; 