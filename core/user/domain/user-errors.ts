import { DomainError } from '../../common/domain/exceptions/domain.error';

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`User with id ${userId} not found`, 'USER_NOT_FOUND', 404);
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 'USER_ALREADY_EXISTS', 409);
  }
}

export class UserNotActiveError extends DomainError {
  constructor(userId: string) {
    super(`User with id ${userId} is not active`, 'USER_NOT_ACTIVE', 403);
  }
}

export class UserEmailNotVerifiedError extends DomainError {
  constructor(userId: string) {
    super(`User with id ${userId} email is not verified`, 'USER_EMAIL_NOT_VERIFIED', 403);
  }
}

export class UserRoleChangeNotAllowedError extends DomainError {
  constructor(userId: string, newRole: string) {
    super(`Role change to ${newRole} is not allowed for user ${userId}`, 'USER_ROLE_CHANGE_NOT_ALLOWED', 403);
  }
} 