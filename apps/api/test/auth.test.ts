import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { permissions, sessionResponseSchema } from '@flex/contracts';
import {
  DASHBOARD_ORIGIN,
  STRONG_PASSWORD,
  createTestApp,
  resetDatabase,
  seedAccessCode,
  seedUser,
} from './support';

describe('rotas de autenticação', () => {
  const context = createTestApp();

  beforeEach(() => resetDatabase(context.pool));
  afterAll(() => context.pool.end());

  const post = (path: string, body: unknown, cookie?: string) => {
    const call = request(context.app)
      .post(path)
      .set('origin', DASHBOARD_ORIGIN);
    if (cookie) call.set('cookie', cookie);
    return call.send(body as object);
  };

  const login = (username: string, password = STRONG_PASSWORD) =>
    post('/v1/auth/login', { username, password });

  const cookieFrom = (response: request.Response) =>
    (response.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!;

  it('ativa uma conta e autentica com as permissões atuais', async () => {
    const user = await seedUser(context, { permissions: [...permissions] });
    const code = await seedAccessCode(context, user.id, 'activation');

    const activation = await post('/v1/auth/activate', {
      code,
      newPassword: STRONG_PASSWORD,
      newPasswordConfirmation: STRONG_PASSWORD,
    });
    expect(activation.status).toBe(204);

    const authenticated = await login(user.username);
    expect(authenticated.status).toBe(204);
    const session = await request(context.app)
      .get('/v1/auth/session')
      .set('cookie', cookieFrom(authenticated));
    const body = sessionResponseSchema.parse(session.body);
    expect(session.status).toBe(200);
    expect(body.user.username).toBe(user.username);
    expect([...body.permissions].sort()).toEqual([...permissions].sort());
  });

  it('emite um JWT em cookie HttpOnly, Secure e SameSite=Strict', async () => {
    await seedUser(context, { password: STRONG_PASSWORD });
    const response = await login('maria.silva');
    const cookie = (response.headers['set-cookie'] as unknown as string[])[0]!;

    expect(response.status).toBe(204);
    expect(cookie).toMatch(/^__Host-session=[^.]+\.[^.]+\.[^;]+;/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).not.toMatch(/Domain=/i);
  });

  it('responde de forma neutra para credenciais inválidas e contas indisponíveis', async () => {
    await seedUser(context, { username: 'ativa', password: STRONG_PASSWORD });
    await seedUser(context, {
      username: 'inativa',
      password: STRONG_PASSWORD,
      status: 'inactive',
    });

    for (const [username, password] of [
      ['ativa', 'senha incorreta'],
      ['inexistente', STRONG_PASSWORD],
      ['inativa', STRONG_PASSWORD],
    ]) {
      const response = await login(username!, password!);
      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    }
  });

  it('encerra a autenticação no navegador apagando o cookie', async () => {
    await seedUser(context, { password: STRONG_PASSWORD });
    const authenticated = await login('maria.silva');
    const response = await post(
      '/v1/auth/logout',
      {},
      cookieFrom(authenticated),
    );

    expect(response.status).toBe(204);
    expect(
      (response.headers['set-cookie'] as unknown as string[])[0],
    ).toContain('__Host-session=;');
  });

  it('invalida tokens emitidos antes de uma troca de senha', async () => {
    await seedUser(context, { password: STRONG_PASSWORD });
    const authenticated = await login('maria.silva');
    const oldCookie = cookieFrom(authenticated);
    const changed = await request(context.app)
      .put('/v1/auth/password')
      .set('origin', DASHBOARD_ORIGIN)
      .set('cookie', oldCookie)
      .send({
        currentPassword: STRONG_PASSWORD,
        newPassword: 'uma senha nova e igualmente segura',
        newPasswordConfirmation: 'uma senha nova e igualmente segura',
      });

    expect(changed.status).toBe(204);
    expect(
      await request(context.app)
        .get('/v1/auth/session')
        .set('cookie', oldCookie),
    ).toMatchObject({ status: 401 });
    expect(
      await request(context.app)
        .get('/v1/auth/session')
        .set('cookie', cookieFrom(changed)),
    ).toMatchObject({ status: 200 });
  });

  it('aplica alterações de permissão sem reemitir o token', async () => {
    const user = await seedUser(context, {
      password: STRONG_PASSWORD,
      permissions: ['plans.view'],
    });
    const authenticated = await login(user.username);
    const cookie = cookieFrom(authenticated);
    await context.pool.query(
      'INSERT INTO user_permissions (user_id, permission) VALUES ($1, $2)',
      [user.id, 'categories.view'],
    );

    const response = await request(context.app)
      .get('/v1/auth/session')
      .set('cookie', cookie);
    expect(response.body.permissions.sort()).toEqual([
      'categories.view',
      'plans.view',
    ]);
  });

  it('protege mutações por origem e aceita a origem do dashboard', async () => {
    await seedUser(context, { password: STRONG_PASSWORD });
    const cookie = cookieFrom(await login('maria.silva'));
    const denied = await request(context.app)
      .post('/v1/auth/logout')
      .set('origin', 'https://origem-invalida.example')
      .set('cookie', cookie)
      .send({});
    const allowed = await post('/v1/auth/logout', {}, cookie);

    expect(denied.status).toBe(403);
    expect(denied.body.code).toBe('CSRF_VALIDATION_FAILED');
    expect(allowed.status).toBe(204);
  });

  it('mantém a recuperação neutra e permite redefinir a senha', async () => {
    await seedUser(context, {
      username: 'com.email',
      email: 'pessoa@exemplo.org',
      password: STRONG_PASSWORD,
    });
    const requested = await post('/v1/auth/recovery-requests', {
      username: 'com.email',
    });
    expect(requested.status).toBe(202);
    await vi.waitFor(() => expect(context.emailSender.sent).toHaveLength(1));
    const code = context.emailSender.lastCodeFor('pessoa@exemplo.org')!;

    const recovered = await post('/v1/auth/recover', {
      code,
      newPassword: 'nova frase secreta para recuperar acesso',
      newPasswordConfirmation: 'nova frase secreta para recuperar acesso',
    });
    expect(recovered.status).toBe(204);
    expect(
      (await login('com.email', 'nova frase secreta para recuperar acesso'))
        .status,
    ).toBe(204);
  });
});
