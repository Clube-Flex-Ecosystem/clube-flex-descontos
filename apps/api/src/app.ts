import { loadEnv } from './config/env';
import { createApp } from './http/app';
import { createDatabaseReadinessCheck } from './infrastructure/database/readiness';
import { createLogger } from './infrastructure/logger/logger';
import { pool } from './infrastructure/database/drizzle/runtime';

export const env = loadEnv();
export const logger = createLogger(env);
export const app = createApp({
    logger,
    checkReadiness: createDatabaseReadinessCheck(pool),
    dashboardOrigin: env.DASHBOARD_ORIGIN,
    catalogOrigin: env.CATALOG_ORIGIN,
    authSecret: env.AUTH_SECRET,
    trustProxyHops: env.TRUST_PROXY_HOPS,
});
