export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class ValidationException extends DomainException {
  constructor(
    message: string,
    public readonly errors: unknown[] = [],
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationException';
  }
}

export class NotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND');
    this.name = 'NotFoundException';
  }
}
