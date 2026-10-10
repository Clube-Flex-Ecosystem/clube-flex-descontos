import express from 'express';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { problemDetailsSchema } from '@flex/contracts';
import { createAuthenticationMiddleware } from '../src/http/middlewares/authentication.middleware';
import { csrfProtection } from '../src/http/middlewares/csrf.middleware';
import { globalErrorHandler } from '../src/http/middlewares/global-error-handler.middleware';
import { requirePermissions } from '../src/http/middlewares/require-permissions.middleware';
import { createHttpLogger } from '../src/infrastructure/logger/http-logger';
import {
  STRONG_PASSWORD,
  createTestApp,
  resetDatabase,
  seedUser,
} from './support';

// Operações administrativas só chegam nos incrementos seguintes; aqui as rotas de teste
// exercitam o pipeline real de sessão, CSRF e autorização com PostgreSQL.
describe('autorização por permissões', () => {
  const context = createTestApp();

  const guarded = express();
  const authenticate = createAuthenticationMiddleware(
    (input) => context.root.identity.resolveSession.execute(input),
    { required: true },
  );
  guarded.use(createHttpLogger(context.logger));
  guarded.get(
    '/leitura',
    authenticate,
    requirePermissions('partners.view'),
    (_req, res) => {
      res.json({ ok: true });
    },
  );
  guarded.post(
    '/escrita',
    authenticate,
    csrfProtection,
    requirePermissions('partners.view', 'partners.update'),
    (_req, res) => {
      res.json({ ok: true });
    },
  );
  guarded.use(globalErrorHandler);

  beforeEach(() => resetDatabase(context.pool));
  afterAll(() => context.pool.end());

  async function sessionFor(seed: Parameters<typeof seedUser>[1] = {}) {
    await seedUser(context, { password: STRONG_PASSWORD, ...seed });
    const login = await request(context.app)
      .post('/v1/auth/login')
      .set('origin', 'http://localhost:5173')
      .send({ username: 'maria.silva', password: STRONG_PASSWORD });
    const cookie = (
      login.headers['set-cookie'] as unknown as string[]
    )[0]!.split(';')[0]!;
    const session = await request(context.app)
      .get('/v1/auth/session')
      .set('cookie', cookie);
    return { cookie, csrf: session.headers['x-csrf-token'] as string };
  }

  it('responde 401 sem sessão e 403 sem a permissão exigida', async () => {
    const anonymous = await request(guarded).get('/leitura');
    const { cookie } = await sessionFor({ permissions: ['leads.view-own'] });
    const forbidden = await request(guarded)
      .get('/leitura')
      .set('cookie', cookie);

    expect(anonymous.status).toBe(401);
    expect(problemDetailsSchema.parse(anonymous.body).code).toBe(
      'AUTHENTICATION_REQUIRED',
    );
    expect(forbidden.status).toBe(403);
    expect(problemDetailsSchema.parse(forbidden.body).code).toBe(
      'PERMISSION_DENIED',
    );
  });

  it('permite a operação quando todas as permissões exigidas estão concedidas', async () => {
    const { cookie } = await sessionFor({ permissions: ['partners.view'] });

    const response = await request(guarded)
      .get('/leitura')
      .set('cookie', cookie);

    expect(response.status).toBe(200);
  });

  it('exige todas as permissões declaradas pela rota', async () => {
    const { cookie, csrf } = await sessionFor({
      permissions: ['partners.view'],
    });

    const response = await request(guarded)
      .post('/escrita')
      .set('cookie', cookie)
      .set('x-csrf-token', csrf);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('PERMISSION_DENIED');
  });

  it('aplica CSRF antes da autorização em operações mutáveis', async () => {
    const { cookie } = await sessionFor({
      permissions: ['partners.view', 'partners.update'],
    });

    const response = await request(guarded)
      .post('/escrita')
      .set('cookie', cookie);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('CSRF_VALIDATION_FAILED');
  });

  it('a revogação da permissão vale na próxima requisição da mesma sessão', async () => {
    const { cookie } = await sessionFor({ permissions: ['partners.view'] });
    expect(
      (await request(guarded).get('/leitura').set('cookie', cookie)).status,
    ).toBe(200);

    await context.pool.query(
      "DELETE FROM user_permissions WHERE permission = 'partners.view'",
    );

    expect(
      (await request(guarded).get('/leitura').set('cookie', cookie)).status,
    ).toBe(403);
  });

  it('a desativação da conta encerra o acesso na próxima requisição', async () => {
    const { cookie } = await sessionFor({ permissions: ['partners.view'] });

    await context.pool.query("UPDATE users SET status = 'inactive'");

    expect(
      (await request(guarded).get('/leitura').set('cookie', cookie)).status,
    ).toBe(401);
  });
});
