import { pino, type DestinationStream, type Logger } from 'pino';
import type { Env } from '../../config/env';

// Redação defensiva: segredos nunca devem chegar ao log, mesmo por engano.
const redactedPaths = [
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'newPassword',
  'currentPassword',
  'token',
  'accessCode',
  'body.code',
  '*.authorization',
  '*.cookie',
  '*.set-cookie',
  '*.password',
  '*.newPassword',
  '*.currentPassword',
  '*.token',
  '*.accessCode',
  '*.body.code',
];

export function createLogger(
  env: Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>,
  destination?: DestinationStream,
): Logger {
  const level =
    env.LOG_LEVEL ?? (env.NODE_ENV === 'production' ? 'info' : 'debug');
  const options = {
    level,
    redact: { paths: redactedPaths, censor: '[REDACTED]' },
  };

  if (destination) {
    return pino(options, destination);
  }

  // `pino-pretty` é restrito ao desenvolvimento local.
  if (env.NODE_ENV === 'development') {
    return pino({ ...options, transport: { target: 'pino-pretty' } });
  }

  return pino(options);
}
