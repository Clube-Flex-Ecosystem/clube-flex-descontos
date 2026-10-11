import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import type { CatalogUseCases } from '../modules/catalog/controllers/catalog.controllers';
import type { IdentityUseCases } from '../modules/identity/controllers/identity.controllers';
import type { ResolveSessionUseCase } from '../modules/identity/use-cases/resolve-session.use-case';
import { createHttpLogger } from '../infrastructure/logger/http-logger';
import { createCorsMiddleware } from './middlewares/cors.middleware';
import { createOriginMiddleware } from './middlewares/csrf.middleware';
import { globalErrorHandler } from './middlewares/global-error-handler.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import {
  createAuthRateLimiters,
  type AuthRateLimiters,
} from './middlewares/rate-limit.middleware';
import { createAdminCatalogRouter } from './routes/admin-catalog.routes';
import { createAuthRouter } from './routes/auth.routes';
import { createPublicCatalogRouter } from './routes/public-catalog.routes';
import { createPublicContactRouter } from './routes/public-contact.routes';
import type { PublicContactService } from '../modules/leads/public-contact.service';
import type { PublicCatalogService } from '../modules/catalog/use-cases/public-catalog.service';
import {
  createHealthRouter,
  type ReadinessCheck,
} from './routes/health.routes';

export interface AppDependencies {
  logger: Logger;
  checkReadiness: ReadinessCheck;
  identity: IdentityUseCases & { resolveSession: ResolveSessionUseCase };
  catalog: CatalogUseCases & { public: PublicCatalogService };
  leads: { public: PublicContactService };
  /** Origens com permissão para CORS com credenciais e para operações mutáveis. */
  allowedOrigins: readonly string[];
  /** Proxies confiáveis à frente da API; `0` ignora `X-Forwarded-For`. */
  trustProxyHops?: number;
  limiters?: AuthRateLimiters;
}

export function createApp({
  logger,
  checkReadiness,
  identity,
  catalog,
  leads,
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
  app.use('/v1/public', createPublicCatalogRouter(catalog.public));
  app.use('/v1/public', createPublicContactRouter(leads.public));

  app.use(
    '/v1/auth',
    createAuthRouter({
      useCases: identity,
      resolveSession: (input) => identity.resolveSession.execute(input),
      limiters,
      originGuard: createOriginMiddleware(allowedOrigins),
    }),
  );

  app.use(
    '/v1/admin',
    createAdminCatalogRouter({
      useCases: catalog,
      resolveSession: (input) => identity.resolveSession.execute(input),
      originGuard: createOriginMiddleware(allowedOrigins),
    }),
  );

  app.use(notFoundMiddleware);
  app.use(globalErrorHandler);

  return app;
}
