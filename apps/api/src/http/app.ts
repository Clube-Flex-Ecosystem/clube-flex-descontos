import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { createHttpLogger } from '../infrastructure/logger/http-logger';
import { createCorsMiddleware } from './middlewares/cors.middleware';
import { createOriginMiddleware } from './middlewares/csrf.middleware';
import { globalErrorHandler } from './middlewares/global-error-handler.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import {
  createAuthRateLimiters,
  type AuthRateLimiters,
} from './middlewares/rate-limit.middleware';
import { createAdminCatalogRouter } from './routes/admin-catalog.route';
import { createAuthRouter } from './routes/auth.route';
import { publicCatalogRouter } from '../modules/catalog/public-catalog.route';
import { publicContactRouter } from '../modules/leads/public-contact.route';
import { createAdminGovernanceRouter } from './routes/admin-governance.route';
import { createAdminCommercialRouter } from './routes/admin-commercial.route';
import { createHealthRouter, type ReadinessCheck } from './routes/health.route';

export interface AppDependencies {
  logger: Logger;
  checkReadiness: ReadinessCheck;
  /** Origens com permissão para CORS com credenciais e para operações mutáveis. */
  allowedOrigins: readonly string[];
  /** Proxies confiáveis à frente da API; `0` ignora `X-Forwarded-For`. */
  trustProxyHops?: number;
  limiters?: AuthRateLimiters;
}

export function createApp({
  logger,
  checkReadiness,
  allowedOrigins,
  trustProxyHops = 0,
  limiters = createAuthRateLimiters(),
}: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  if (trustProxyHops > 0) app.set('trust proxy', trustProxyHops);

  app.use(createHttpLogger(logger));
  app.use(helmet());
  app.use(createCorsMiddleware(allowedOrigins));
  app.use(express.json({ limit: '100kb' }));

  app.use('/v1/health', createHealthRouter(checkReadiness));
  app.use('/v1/public', publicCatalogRouter);
  app.use('/v1/public', publicContactRouter);

  app.use(
    '/v1/auth',
    createAuthRouter({
      limiters,
      originGuard: createOriginMiddleware(allowedOrigins),
    }),
  );

  app.use(
    '/v1/admin',
    createAdminCatalogRouter({
      originGuard: createOriginMiddleware(allowedOrigins),
    }),
  );
  app.use(
    '/v1/admin',
    createAdminCommercialRouter({
      originGuard: createOriginMiddleware(allowedOrigins),
    }),
  );

  app.use(
    '/v1/admin',
    createAdminGovernanceRouter({
      originGuard: createOriginMiddleware(allowedOrigins),
    }),
  );

  app.use(notFoundMiddleware);
  app.use(globalErrorHandler);

  return app;
}
