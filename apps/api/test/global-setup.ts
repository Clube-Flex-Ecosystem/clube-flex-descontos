import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { runMigrations } from '../src/infrastructure/database/drizzle/migrate';
import { testDatabaseUrl } from './database';

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

/** Recria o banco de testes do zero e aplica todas as migrations antes da suíte. */
export default async function setup(): Promise<void> {
    const pool = new pg.Pool({ connectionString: testDatabaseUrl });
    try {
        await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
        await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
        await pool.query('CREATE SCHEMA public');
        await runMigrations(pool, migrationsFolder);
    } finally {
        await pool.end();
    }
}
