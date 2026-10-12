import cors from 'cors';
import cookieParser from 'cookie-parser';
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
    app.use(
        cors({
            origin: [dashboardOrigin, catalogOrigin],
            credentials: true,
            exposedHeaders: ['x-request-id', 'retry-after', 'etag'],
            allowedHeaders: ['content-type', 'if-match'],
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            maxAge: 600,
        }),
    );
    app.use(express.json({ limit: '100kb' }));
    app.use(cookieParser());

    app.use('/v1/health', createHealthRouter(checkReadiness));
    app.use('/v1/public', publicCatalogRouter, publicContactRouter);

    app.use('/v1/auth', noStore, authRouter);
    app.use(
        '/v1/admin',
        noStore,
        authenticate,
        adminCatalogRouter,
        adminCommercialRouter,
        adminGovernanceRouter,
    );

    app.use(notFoundMiddleware);
    app.use(globalErrorHandler);
    return app;
}
