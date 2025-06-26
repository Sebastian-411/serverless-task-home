/**
 * Domain Constants
 * Centralized constants for business logic
 */

/**
 * User role enumeration
 * @readonly
 * @enum {string}
 */
const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user'
});

/**
 * Task status enumeration
 * @readonly
 * @enum {string}
 */
const TASK_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
});

/**
 * Task priority enumeration
 * @readonly
 * @enum {string}
 */
const TASK_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
});

/**
 * Validation constants
 */
const VALIDATION_RULES = Object.freeze({
  USER: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 20
  },
  TASK: {
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 2000
  },
  ADDRESS: {
    LINE_MAX_LENGTH: 100,
    CITY_MAX_LENGTH: 50,
    STATE_MAX_LENGTH: 50,
    POSTAL_CODE_MIN_LENGTH: 3,
    POSTAL_CODE_MAX_LENGTH: 10,
    COUNTRY_MIN_LENGTH: 2,
    COUNTRY_MAX_LENGTH: 50
  }
});

module.exports = {
  USER_ROLES,
  TASK_STATUS,
  TASK_PRIORITY,
  VALIDATION_RULES
}; 