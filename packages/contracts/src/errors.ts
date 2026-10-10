import { z } from 'zod';

export const errorCodes = [
  'MALFORMED_REQUEST',
  'AUTHENTICATION_REQUIRED',
  'INVALID_CREDENTIALS',
  'PERMISSION_DENIED',
  'CSRF_VALIDATION_FAILED',
  'RESOURCE_NOT_FOUND',
  'VALIDATION_ERROR',
  'RATE_LIMIT_EXCEEDED',
  'INTERNAL_SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
] as const;

export const errorCodeSchema = z.enum(errorCodes);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const fieldErrorSchema = z.object({
  field: z.string(),
  code: z.string(),
  message: z.string(),
});
export type FieldError = z.infer<typeof fieldErrorSchema>;

/** Erro HTTP no formato `application/problem+json` (RFC 9457). */
export const problemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: errorCodeSchema,
  detail: z.string(),
  requestId: z.string().uuid(),
  errors: z.array(fieldErrorSchema).optional(),
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
