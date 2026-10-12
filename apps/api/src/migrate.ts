import { fileURLToPath } from 'node:url';
import { loadEnv } from './config/env';
import { createPool } from './infrastructure/database/drizzle/client';
import { runMigrations } from './infrastructure/database/drizzle/migrate';
import { createLogger } from './infrastructure/logger/logger';

// `src/migrate.ts` e `dist/migrate.js` ficam um nível abaixo da pasta `drizzle`.
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

const env = loadEnv();
const logger = createLogger(env);
const pool = createPool(env.DATABASE_URL);

try {
    await runMigrations(pool, migrationsFolder);
    logger.info('Migrações aplicadas');
} catch (error) {
    logger.error({ err: error }, 'Falha ao aplicar migrações');
    process.exitCode = 1;
} finally {
    await pool.end();
}
