import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type pg from 'pg';
import { createDatabase } from './client';

export async function runMigrations(
    pool: pg.Pool,
    migrationsFolder: string,
): Promise<void> {
    await migrate(createDatabase(pool), { migrationsFolder });
}
