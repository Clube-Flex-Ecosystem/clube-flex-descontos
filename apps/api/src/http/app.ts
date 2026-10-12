import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { configureJwt } from '../infrastructure/security/jwt';
import { createHttpLogger } from '../infrastructure/logger/http-logger';
import { publicCatalogRouter } from '../modules/catalog/public-catalog.route';
import { publicContactRouter } from '../modules/leads/public-contact.route';
import { authenticate } from './middlewares/authentication.middleware';
import { globalErrorHandler } from './middlewares/global-error-handler.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { adminCatalogRouter } from './routes/admin-catalog.route';
import { adminCommercialRouter } from './routes/admin-commercial.route';
import { adminGovernanceRouter } from './routes/admin-governance.route';
import { authRouter } from './routes/auth.route';
import { createHealthRouter, type ReadinessCheck } from './routes/health.route';
import { sendProblem } from './problem';

export interface AppDependencies {
  logger: Logger;
  checkReadiness: ReadinessCheck;
  dashboardOrigin: string;
  catalogOrigin: string;
  authSecret: string;
  trustProxyHops?: number;
}

const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('cache-control', 'no-store');
  next();
};

export function createApp({
  logger,
  checkReadiness,
  dashboardOrigin,
  catalogOrigin,
  authSecret,
  trustProxyHops = 0,
}: AppDependencies): Express {
  configureJwt(authSecret);
  const app = express();
  app.disable('x-powered-by');
  if (trustProxyHops > 0) app.set('trust proxy', trustProxyHops);

  app.use(createHttpLogger(logger));
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));

  app.use('/v1/health', createHealthRouter(checkReadiness));
  app.use(
    '/v1/public',
    cors({ origin: catalogOrigin, methods: ['GET', 'POST'] }),
    publicCatalogRouter,
    publicContactRouter,
  );

  const dashboardCors = cors({
    origin: dashboardOrigin,
    credentials: true,
    exposedHeaders: ['x-request-id', 'retry-after', 'etag'],
    allowedHeaders: ['content-type', 'if-match'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    maxAge: 600,
  });
  const dashboardOriginGuard: RequestHandler = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const declared = req.headers.origin ?? refererOrigin(req.headers.referer);
    if (declared && declared !== dashboardOrigin) {
      sendProblem(req, res, 'CSRF_VALIDATION_FAILED');
      return;
    }
    next();
  };

  app.use('/v1/auth', noStore, dashboardCors, dashboardOriginGuard, authRouter);
  app.use(
    '/v1/admin',
    noStore,
    dashboardCors,
    dashboardOriginGuard,
    authenticate,
    adminCatalogRouter,
    adminCommercialRouter,
    adminGovernanceRouter,
  );

  app.use(notFoundMiddleware);
  app.use(globalErrorHandler);
  return app;
}

function refererOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}
