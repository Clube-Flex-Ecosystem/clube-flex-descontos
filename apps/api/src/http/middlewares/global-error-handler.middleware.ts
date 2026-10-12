import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import {
  fieldErrorMessages,
  type FieldErrorCode,
  type ProblemDetails,
} from '@flex/contracts';
import { AppError, HttpError } from '../../errors/app-error';

function isMalformedBody(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error.type === 'entity.parse.failed' || error.type === 'entity.too.large')
  );
}

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (isMalformedBody(error)) {
    error = new HttpError('MALFORMED_REQUEST');
  }

  if (error instanceof ZodError) {
    error = new HttpError('VALIDATION_ERROR', {
      errors: error.issues.map((issue) => {
        const code =
          issue.message in fieldErrorMessages
            ? (issue.message as FieldErrorCode)
            : 'INVALID_VALUE';
        return {
          field: issue.path.length ? issue.path.join('.') : 'body',
          code,
          message: fieldErrorMessages[code],
        };
      }),
    });
  }

  if (error instanceof AppError) {
    for (const [name, value] of Object.entries(error.headers ?? {})) {
      res.setHeader(name, value);
    }
    const body: ProblemDetails = {
      type: `urn:flex:error:${error.code.toLowerCase().replaceAll('_', '-')}`,
      title: error.title,
      status: error.status,
      code: error.code,
      detail: error.message,
      requestId: String(req.id),
      ...(error.errors?.length ? { errors: error.errors } : {}),
    };
    res.status(error.status).type('application/problem+json').json(body);
    return;
  }

  // O stack trace fica somente no log interno, correlacionado pelo requestId.
  req.log.error({ err: error }, 'Erro inesperado');
  const internal = new HttpError('INTERNAL_SERVER_ERROR');
  const body: ProblemDetails = {
    type: 'urn:flex:error:internal-server-error',
    title: internal.title,
    status: internal.status,
    code: internal.code,
    detail: internal.message,
    requestId: String(req.id),
  };
  res.status(500).type('application/problem+json').json(body);
};
