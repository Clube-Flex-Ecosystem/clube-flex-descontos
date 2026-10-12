export class CommercialNotFoundError extends Error {}
export class CommercialConflictError extends Error {
  constructor(
    public readonly code = 'RESOURCE_VERSION_CONFLICT',
    public readonly existingId?: string,
  ) {
    super(code);
  }
}
export class CommercialForbiddenError extends Error {}
export class CommercialValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly code: string,
  ) {
    super(code);
  }
}
