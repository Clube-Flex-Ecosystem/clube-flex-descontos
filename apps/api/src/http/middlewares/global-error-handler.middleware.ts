import type { ErrorRequestHandler } from 'express';
import { sendProblem } from '../problem';

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
    sendProblem(req, res, 'MALFORMED_REQUEST');
    return;
  }

  // O stack trace fica somente no log interno, correlacionado pelo requestId.
  req.log.error({ err: error }, 'Erro inesperado');
  sendProblem(req, res, 'INTERNAL_SERVER_ERROR');
};
