import type { z } from 'zod';
import {
  fieldErrorMessages,
  type FieldError,
  type FieldErrorCode,
} from '@flex/contracts';

export function fieldError(field: string, code: FieldErrorCode): FieldError {
  return { field, code, message: fieldErrorMessages[code] };
}

function isFieldErrorCode(value: string): value is FieldErrorCode {
  return value in fieldErrorMessages;
}

export type ParseResult<T> =
  { success: true; data: T } | { success: false; errors: FieldError[] };

/** Valida com um esquema do contrato e converte as falhas para erros de campo. */
export function parseBody<T>(
  schema: z.ZodType<T>,
  body: unknown,
): ParseResult<T> {
  const result = schema.safeParse(body);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    errors: result.error.issues.map((issue) =>
      fieldError(
        issue.path.length ? issue.path.join('.') : 'body',
        isFieldErrorCode(issue.message) ? issue.message : 'INVALID_VALUE',
      ),
    ),
  };
}
