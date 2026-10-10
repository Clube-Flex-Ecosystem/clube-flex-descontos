import pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { testDatabaseUrl } from './database';

describe('migrations', () => {
  const pool = new pg.Pool({ connectionString: testDatabaseUrl });

  afterAll(() => pool.end());

  it('foram aplicadas em banco vazio antes da suíte', async () => {
    const { rows } = await pool.query(
      'SELECT count(*)::int AS applied FROM drizzle.__drizzle_migrations',
    );

    expect(rows[0].applied).toBeGreaterThanOrEqual(1);
  });
});
