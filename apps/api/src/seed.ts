import { permissions } from '@flex/contracts';
import { loadEnv } from './config/env';
import { createPool } from './infrastructure/database/drizzle/client';
import { Bcrypt } from './infrastructure/security/bcrypt';

const password = process.env.SEED_SUPPORT_PASSWORD;
if (!password)
    throw new Error('Defina SEED_SUPPORT_PASSWORD para executar o seed.');

const env = loadEnv();
const pool = createPool(env.DATABASE_URL);

try {
    const passwordHash = await new Bcrypt(env.BCRYPT_ROUNDS).hash(password);
    await pool.query('BEGIN');
    const result = await pool.query<{ id: string }>(
        `INSERT INTO users (full_name, username, status, password_hash)
     VALUES ('Suporte', 'suporte', 'active', $1)
     ON CONFLICT (username) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       status = 'active',
       password_hash = EXCLUDED.password_hash,
       password_change_required = false,
       auth_version = users.auth_version + 1,
       updated_at = now()
     RETURNING id`,
        [passwordHash],
    );
    const userId = result.rows[0]!.id;
    await pool.query('DELETE FROM user_permissions WHERE user_id = $1', [
        userId,
    ]);
    for (const permission of permissions) {
        await pool.query(
            'INSERT INTO user_permissions (user_id, permission) VALUES ($1, $2)',
            [userId, permission],
        );
    }
    await pool.query('COMMIT');
    process.stdout.write(
        'Seed concluído: usuário suporte atualizado com todas as permissões.\n',
    );
} catch (error) {
    await pool.query('ROLLBACK');
    throw error;
} finally {
    await pool.end();
}
