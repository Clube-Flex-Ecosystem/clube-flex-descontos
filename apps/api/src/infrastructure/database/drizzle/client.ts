import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

export function createPool(databaseUrl: string): pg.Pool {
  return new pg.Pool({ connectionString: databaseUrl });
}

export function createDatabase(pool: pg.Pool) {
  return drizzle(pool, { schema });
}

export type Database = ReturnType<typeof createDatabase>;

/** Banco ou transação: ambos aceitam as mesmas consultas dos repositories. */
export type DatabaseExecutor = Pick<
  Database,
  'select' | 'insert' | 'update' | 'delete' | 'execute'
>;
