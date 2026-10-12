import type pg from 'pg';

export function createDatabaseReadinessCheck(pool: pg.Pool) {
    return async (): Promise<void> => {
        await pool.query('SELECT 1');
    };
}
