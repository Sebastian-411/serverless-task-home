/**
 * Application Constants
 * Defines all enums and fixed values for data models
 */

const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user'
});

const TASK_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
});

const TASK_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
});

const VALIDATION_PATTERNS = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
});

const VALIDATION_MESSAGES = Object.freeze({
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone number format',
  INVALID_UUID: 'Invalid UUID format',
  INVALID_ROLE: `Role must be one of: ${Object.values(USER_ROLES).join(', ')}`,
  INVALID_STATUS: `Status must be one of: ${Object.values(TASK_STATUS).join(', ')}`,
  INVALID_PRIORITY: `Priority must be one of: ${Object.values(TASK_PRIORITY).join(', ')}`
});

module.exports = {
  USER_ROLES,
  TASK_STATUS,
  TASK_PRIORITY,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES
}; 