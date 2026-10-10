import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import { permissions } from '@flex/contracts';
import { BootstrapRefusedError } from '../src/modules/identity/errors';
import { createTestApp, resetDatabase, seedUser } from './support';

describe('bootstrap do primeiro administrador', () => {
  const context = createTestApp();
  const { pool, root, emailSender } = context;

  beforeEach(async () => {
    await resetDatabase(pool);
    emailSender.sent.length = 0;
    emailSender.failing = false;
  });
  afterAll(() => pool.end());

  it('cria usuário ativo, sem senha, com todas as permissões existentes', async () => {
    const result = await root.identity.bootstrapFirstAdministrator.execute({
      fullName: 'João da Silva',
    });

    expect(result.user.username).toBe('joao.da.silva');
    const { rows } = await pool.query(
      'SELECT status, password_hash FROM users WHERE id = $1',
      [result.user.id],
    );
    expect(rows[0]).toEqual({ status: 'active', password_hash: null });

    const granted = await pool.query<{ permission: string }>(
      'SELECT permission FROM user_permissions WHERE user_id = $1',
      [result.user.id],
    );
    expect(granted.rows.map((row) => row.permission).sort()).toEqual(
      [...permissions].sort(),
    );
  });

  it('exibe o código uma única vez quando não há e-mail', async () => {
    const result = await root.identity.bootstrapFirstAdministrator.execute({
      fullName: 'Maria Silva',
    });

    expect(result.accessCode).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/);
    expect(result.deliveryFailed).toBe(false);
    expect(emailSender.sent).toHaveLength(0);

    const { rows } = await pool.query(
      'SELECT code_hash, purpose FROM access_codes',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].purpose).toBe('activation');
    expect(JSON.stringify(rows)).not.toContain(result.accessCode);
  });

  it('envia o código por e-mail e não o devolve quando há e-mail', async () => {
    const result = await root.identity.bootstrapFirstAdministrator.execute({
      fullName: 'Maria Silva',
      email: 'maria@exemplo.org',
    });

    expect(result.accessCode).toBeUndefined();
    expect(emailSender.lastCodeFor('maria@exemplo.org')).toBeDefined();
  });

  it('recorre à entrega manual quando o envio de e-mail falha, sem desfazer a conta', async () => {
    emailSender.failing = true;

    const result = await root.identity.bootstrapFirstAdministrator.execute({
      fullName: 'Maria Silva',
      email: 'maria@exemplo.org',
    });

    expect(result.accessCode).toBeDefined();
    expect(result.deliveryFailed).toBe(true);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
    expect(rows[0].n).toBe(1);
  });

  it('registra auditoria com o ator técnico system/bootstrap, sem segredos', async () => {
    const result = await root.identity.bootstrapFirstAdministrator.execute({
      fullName: 'Maria Silva',
    });

    const { rows } = await pool.query(
      'SELECT action, actor_user_id, actor_label, target_id, before, after FROM audit_events ORDER BY action',
    );
    expect(rows.map((row) => row.action)).toEqual([
      'user.access-code.issued',
      'user.created',
      'user.permissions.updated',
    ]);
    for (const row of rows) {
      expect(row.actor_label).toBe('system/bootstrap');
      expect(row.actor_user_id).toBeNull();
      expect(row.target_id).toBe(result.user.id);
    }
    expect(JSON.stringify(rows)).not.toContain(result.accessCode);
  });

  it('recusa a execução quando já existe qualquer usuário', async () => {
    await seedUser(context, { username: 'existente' });

    await expect(
      root.identity.bootstrapFirstAdministrator.execute({
        fullName: 'Outra Pessoa',
      }),
    ).rejects.toBeInstanceOf(BootstrapRefusedError);

    const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
    expect(rows[0].n).toBe(1);
  });

  it('cria somente um administrador em execuções concorrentes', async () => {
    const outcomes = await Promise.allSettled([
      root.identity.bootstrapFirstAdministrator.execute({
        fullName: 'Ana Souza',
      }),
      root.identity.bootstrapFirstAdministrator.execute({
        fullName: 'Ana Souza',
      }),
      root.identity.bootstrapFirstAdministrator.execute({
        fullName: 'Ana Souza',
      }),
    ]);

    expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(1);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
    expect(rows[0].n).toBe(1);
  });
});
