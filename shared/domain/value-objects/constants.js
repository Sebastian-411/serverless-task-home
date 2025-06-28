/**
 * Domain Constants
 * Shared constants across the domain
 */

const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
  URGENT: 'urgent'  // Alias for critical
};

const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin'
};

const VALIDATION_RULES = {
  USER: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 254,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15
  },
  TASK: {
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 2000
  },
  ADDRESS: {
    STREET_MIN_LENGTH: 5,
    STREET_MAX_LENGTH: 200,
    CITY_MIN_LENGTH: 2,
    CITY_MAX_LENGTH: 100,
    COUNTRY_MIN_LENGTH: 2,
    COUNTRY_MAX_LENGTH: 100,
    POSTAL_CODE_MIN_LENGTH: 3,
    POSTAL_CODE_MAX_LENGTH: 20
  }
};

module.exports = {
  TASK_STATUS,
  TASK_PRIORITY,
  USER_ROLE,
  VALIDATION_RULES
}; 