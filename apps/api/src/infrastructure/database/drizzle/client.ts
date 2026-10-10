import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

export function createPool(databaseUrl: string): pg.Pool {
  return new pg.Pool({ connectionString: databaseUrl });
}

export function createDatabase(pool: pg.Pool) {
  return drizzle(pool);
}
