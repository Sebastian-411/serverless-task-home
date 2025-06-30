import { DomainError } from '../../common/domain/exceptions/domain.error';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(email: string) {
    super(`User with email ${email} not found`, 'USER_NOT_FOUND', 404);
  }
}

export class AuthenticationFailedError extends DomainError {
  constructor() {
    super('Authentication failed', 'AUTHENTICATION_FAILED', 401);
  }
} 