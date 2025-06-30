import { DomainError } from './domain.error';

/**
 * EntityNotFoundError
 * Thrown when an entity is not found in the repository
 */

export class EntityNotFoundError extends DomainError {
  constructor(
    entityName: string,
    identifier: string | number,
    details?: Record<string, unknown>
  ) {
    super(
      `${entityName} with identifier '${identifier}' not found`,
      'ENTITY_NOT_FOUND',
      404,
      details
    );
  }

  static forUser(id: string): EntityNotFoundError {
    return new EntityNotFoundError('User', id);
  }
} 