import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { createHttpLogger } from '../infrastructure/logger/http-logger';
import { globalErrorHandler } from './middlewares/global-error-handler.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import {
  createHealthRouter,
  type ReadinessCheck,
} from './routes/health.routes';

export interface AppDependencies {
  logger: Logger;
  checkReadiness: ReadinessCheck;
}

export function createApp({
  logger,
  checkReadiness,
}: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(createHttpLogger(logger));
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));

  app.use('/v1/health', createHealthRouter(checkReadiness));

  app.use(notFoundMiddleware);
  app.use(globalErrorHandler);

  return app;
}
