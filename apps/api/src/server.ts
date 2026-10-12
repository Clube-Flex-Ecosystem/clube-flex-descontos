import { app, env, logger } from './app';
import { pool } from './infrastructure/database/drizzle/runtime';

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
