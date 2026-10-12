import {
    fieldErrorMessages,
    type ErrorCode,
    type FieldErrorCode,
} from '@flex/contracts';
import { AppError, HttpError } from './app-error';

export { AppError, HttpError };
export interface FieldIssue {
    field: string;
    code: FieldErrorCode;
}
const fieldError = (field: string, code: FieldErrorCode) => ({
    field,
    code,
    message: fieldErrorMessages[code],
});
const fields = (issues: FieldIssue[]) =>
    issues.map((item) => fieldError(item.field, item.code));

export class InvalidCredentialsError extends AppError {
    constructor() {
        super('INVALID_CREDENTIALS');
    }
}
export class InvalidAccessCodeError extends AppError {
    constructor() {
        super('VALIDATION_ERROR', {
            errors: [fieldError('code', 'INVALID_ACCESS_CODE')],
        });
    }
}
export class PasswordPolicyError extends AppError {
    constructor(readonly passwordCode: FieldErrorCode) {
        super('VALIDATION_ERROR', {
            errors: [fieldError('newPassword', passwordCode)],
        });
    }
}
export class InvalidCurrentPasswordError extends AppError {
    constructor() {
        super('VALIDATION_ERROR', {
            errors: [fieldError('currentPassword', 'INVALID_CURRENT_PASSWORD')],
        });
    }
}
export class UserNotFoundError extends AppError {
    constructor() {
        super('RESOURCE_NOT_FOUND');
    }
}
export class UserVersionConflictError extends AppError {
    constructor() {
        super('RESOURCE_VERSION_CONFLICT');
    }
}
export class UsernameTakenError extends AppError {
    constructor() {
        super('VALIDATION_ERROR', {
            errors: [fieldError('username', 'DUPLICATE_USERNAME')],
        });
    }
}
export class ProtectedUserOperationError extends AppError {
    constructor(message?: string) {
        super('PROTECTED_RESOURCE', message ? { detail: message } : {});
    }
}
export class InvalidUserStateError extends AppError {
    constructor(message?: string) {
        super('INVALID_RESOURCE_STATE', message ? { detail: message } : {});
    }
}

export class ResourceNotFoundError extends AppError {
    constructor() {
        super('RESOURCE_NOT_FOUND');
    }
}
export class VersionConflictError extends AppError {
    constructor() {
        super('RESOURCE_VERSION_CONFLICT');
    }
}
export class DuplicateResourceError extends AppError {
    constructor(readonly issues: FieldIssue[]) {
        super('DUPLICATE_RESOURCE', { errors: fields(issues) });
    }
}
export class InvalidResourceStateError extends AppError {
    constructor(message?: string) {
        super('INVALID_RESOURCE_STATE', message ? { detail: message } : {});
    }
}
export class ProtectedResourceError extends AppError {
    constructor(message?: string) {
        super('PROTECTED_RESOURCE', message ? { detail: message } : {});
    }
}
export class PublicationRequirementsError extends AppError {
    constructor(readonly issues: FieldIssue[]) {
        super('PUBLICATION_REQUIREMENTS_NOT_MET', { errors: fields(issues) });
    }
}
export class ReferenceValidationError extends AppError {
    constructor(readonly issues: FieldIssue[]) {
        super('VALIDATION_ERROR', { errors: fields(issues) });
    }
}

export class CommercialNotFoundError extends AppError {
    constructor() {
        super('RESOURCE_NOT_FOUND');
    }
}
export class CommercialForbiddenError extends AppError {
    constructor() {
        super('PERMISSION_DENIED');
    }
}
export class CommercialValidationError extends AppError {
    constructor(
        readonly field: string,
        readonly fieldCode: string,
    ) {
        super('VALIDATION_ERROR', {
            errors: [fieldError(field, fieldCode as FieldErrorCode)],
        });
    }
}
export class CommercialConflictError extends AppError {
    constructor(
        code: ErrorCode = 'RESOURCE_VERSION_CONFLICT',
        readonly existingId?: string,
    ) {
        super(code, existingId ? { detail: existingId } : {});
    }
}
