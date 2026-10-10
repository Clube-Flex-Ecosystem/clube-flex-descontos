import { loadEnv } from './config/env';
import { createApp } from './http/app';
import { createDatabaseReadinessCheck } from './infrastructure/database/readiness';
import { createLogger } from './infrastructure/logger/logger';
import { createRuntime } from './runtime';

const env = loadEnv();
const logger = createLogger(env);
const { pool, root } = createRuntime(env, logger);

const app = createApp({
  logger,
  checkReadiness: createDatabaseReadinessCheck(pool),
  identity: root.identity,
  catalog: root.catalog,
  allowedOrigins: [env.DASHBOARD_ORIGIN],
  trustProxyHops: env.TRUST_PROXY_HOPS,
});

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API iniciada');
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Encerrando API');
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
