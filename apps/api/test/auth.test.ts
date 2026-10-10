import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CSRF_HEADER,
  permissions,
  problemDetailsSchema,
  sessionResponseSchema,
} from '@flex/contracts';
import {
  DASHBOARD_ORIGIN,
  STRONG_PASSWORD,
  createTestApp,
  resetDatabase,
  seedAccessCode,
  seedUser,
} from './support';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

describe('identidade e sessão por HTTP', () => {
  // O limitador é do app; cada teste que exercita limites cria o seu.
  let context = createTestApp();

  beforeEach(async () => {
    await context.pool.end();
    context = createTestApp();
    await resetDatabase(context.pool);
  });
  afterAll(() => context.pool.end());

  const post = (
    path: string,
    body: unknown,
    headers: Record<string, string> = {},
  ) =>
    request(context.app)
      .post(path)
      .set('origin', DASHBOARD_ORIGIN)
      .set(headers)
      .send(body as object);

  const activate = (code: string, password = STRONG_PASSWORD) =>
    post('/v1/auth/activate', {
      code,
      newPassword: password,
      newPasswordConfirmation: password,
    });

  const login = (username: string, password: string, cookie?: string) =>
    post('/v1/auth/login', { username, password }, cookie ? { cookie } : {});

  const sessionCookie = (response: request.Response): string => {
    const header = response.headers['set-cookie'] as unknown as string[];
    return header[0]!.split(';')[0]!;
  };

  /** Autentica e devolve cookie e token CSRF da nova sessão. */
  async function signIn(username: string, password = STRONG_PASSWORD) {
    const response = await login(username, password);
    expect(response.status).toBe(204);
    const cookie = sessionCookie(response);
    const session = await request(context.app)
      .get('/v1/auth/session')
      .set('cookie', cookie);
    return { cookie, csrf: session.headers[CSRF_HEADER] as string, session };
  }

  const activeUser = (overrides = {}) =>
    seedUser(context, { password: STRONG_PASSWORD, ...overrides });

  describe('ativação e login', () => {
    it('ativa a conta do bootstrap, autentica e informa permissões atuais', async () => {
      const boot =
        await context.root.identity.bootstrapFirstAdministrator.execute({
          fullName: 'Maria Silva',
        });

      const activation = await activate(boot.accessCode!);
      expect(activation.status).toBe(204);
      expect(activation.headers['set-cookie']).toBeUndefined();

      const { session, csrf } = await signIn('maria.silva');
      expect(session.status).toBe(200);
      const body = sessionResponseSchema.parse(session.body);
      expect(body.user).toMatchObject({
        fullName: 'Maria Silva',
        username: 'maria.silva',
      });
      expect(body.user.email).toBeUndefined();
      expect([...body.permissions].sort()).toEqual([...permissions].sort());
      expect(csrf).toBeTruthy();
      expect(session.headers['cache-control']).toBe('no-store');
    });

    it('emite cookie host-only, HttpOnly, Secure e SameSite=Strict', async () => {
      await activeUser();

      const response = await login('maria.silva', STRONG_PASSWORD);

      const cookie = (
        response.headers['set-cookie'] as unknown as string[]
      )[0]!;
      expect(cookie).toMatch(/^__Host-session=[A-Za-z0-9_-]{40,};/);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/');
      expect(cookie).not.toMatch(/Domain=/i);
    });

    it('recusa de forma idêntica credenciais incorretas, conta inexistente, inativa ou não ativada', async () => {
      await activeUser({ username: 'ativa' });
      await activeUser({ username: 'inativa', status: 'inactive' });
      await seedUser(context, { username: 'pendente' });

      const attempts = [
        ['ativa', 'senha errada de propósito'],
        ['inexistente', STRONG_PASSWORD],
        ['inativa', STRONG_PASSWORD],
        ['pendente', STRONG_PASSWORD],
      ] as const;
      const responses = [];
      for (const [username, password] of attempts) {
        responses.push(await login(username, password));
      }

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.headers['set-cookie']).toBeUndefined();
        const problem = problemDetailsSchema.parse(response.body);
        expect(problem.code).toBe('INVALID_CREDENTIALS');
        expect({ ...problem, requestId: '' }).toEqual({
          ...responses[0]!.body,
          requestId: '',
        });
      }
    });

    it('aceita o nome de usuário sem diferenciar caixa', async () => {
      await activeUser({ username: 'maria.silva' });

      const response = await login('  Maria.Silva ', STRONG_PASSWORD);

      expect(response.status).toBe(204);
    });

    it('renova o identificador no login e encerra a sessão anterior do navegador', async () => {
      await activeUser();
      const first = await signIn('maria.silva');

      const second = await login('maria.silva', STRONG_PASSWORD, first.cookie);

      expect(second.status).toBe(204);
      expect(sessionCookie(second)).not.toBe(first.cookie);
      const old = await request(context.app)
        .get('/v1/auth/session')
        .set('cookie', first.cookie);
      expect(old.status).toBe(401);
    });

    it('exige autenticação para consultar a sessão', async () => {
      const response = await request(context.app).get('/v1/auth/session');

      expect(response.status).toBe(401);
      expect(problemDetailsSchema.parse(response.body).code).toBe(
        'AUTHENTICATION_REQUIRED',
      );
    });
  });

  describe('códigos de acesso', () => {
    it('é de uso único', async () => {
      const user = await seedUser(context);
      const code = await seedAccessCode(context, user.id, 'activation');

      expect((await activate(code)).status).toBe(204);
      const second = await activate(code, 'outra frase longa e segura 2027');

      expect(second.status).toBe(422);
      expect(second.body.errors[0]).toMatchObject({
        field: 'code',
        code: 'INVALID_ACCESS_CODE',
      });
    });

    it('aceita o código digitado em minúsculas e sem hifens', async () => {
      const user = await seedUser(context);
      const code = await seedAccessCode(context, user.id, 'activation');

      const response = await activate(code.replaceAll('-', '').toLowerCase());

      expect(response.status).toBe(204);
    });

    it('expira em 30 minutos', async () => {
      const user = await seedUser(context);
      const code = await seedAccessCode(context, user.id, 'activation');

      context.clock.advance(30 * MINUTE + 1);
      const response = await activate(code);

      expect(response.status).toBe(422);
      expect(response.body.errors[0].code).toBe('INVALID_ACCESS_CODE');
    });

    it('responde da mesma forma para código inexistente, expirado, usado ou de outra finalidade', async () => {
      const user = await seedUser(context);
      const recovery = await seedAccessCode(context, user.id, 'recovery');

      const unknown = await activate('AAAA-BBBB-CCCC-DDDD');
      const wrongPurpose = await activate(recovery);

      expect(unknown.status).toBe(422);
      expect(wrongPurpose.body.errors).toEqual(unknown.body.errors);
    });

    it('um novo código invalida os anteriores da mesma finalidade', async () => {
      const user = await seedUser(context);
      const first = await seedAccessCode(context, user.id, 'activation');
      const second = await seedAccessCode(context, user.id, 'activation');

      expect((await activate(first)).status).toBe(422);
      expect((await activate(second)).status).toBe(204);
    });

    it('é invalidado depois de cinco tentativas com senha recusada', async () => {
      const user = await seedUser(context);
      const code = await seedAccessCode(context, user.id, 'activation');

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const rejected = await activate(code, 'curta');
        expect(rejected.status).toBe(422);
      }
      const final = await activate(code);

      expect(final.status).toBe(422);
      expect(final.body.errors[0].code).toBe('INVALID_ACCESS_CODE');
      const { rows } = await context.pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id],
      );
      expect(rows[0].password_hash).toBeNull();
    });

    it('não consome tentativas quando a confirmação da senha diverge', async () => {
      const user = await seedUser(context);
      const code = await seedAccessCode(context, user.id, 'activation');

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const response = await post('/v1/auth/activate', {
          code,
          newPassword: STRONG_PASSWORD,
          newPasswordConfirmation: 'diferente da senha informada',
        });
        expect(response.body.errors[0].code).toBe(
          'PASSWORD_CONFIRMATION_MISMATCH',
        );
      }

      expect((await activate(code)).status).toBe(204);
    });

    it('recusa conta inativa', async () => {
      const user = await seedUser(context, { status: 'inactive' });
      const code = await seedAccessCode(context, user.id, 'activation');

      expect((await activate(code)).status).toBe(422);
    });
  });

  describe('regras de senha', () => {
    it.each([
      ['curta demais', 'apenas catorze', 'PASSWORD_TOO_SHORT'],
      ['comum', 'passwordpassword', 'PASSWORD_TOO_COMMON'],
      ['repetida', 'abcdabcdabcdabcdabcd', 'PASSWORD_TOO_COMMON'],
      ['longa demais', 'a1'.repeat(65), 'PASSWORD_TOO_LONG'],
    ])('recusa senha %s', async (_name, password, code) => {
      const user = await seedUser(context);
      const accessCode = await seedAccessCode(context, user.id, 'activation');

      const response = await activate(accessCode, password);

      expect(response.status).toBe(422);
      expect(response.body.errors[0]).toMatchObject({
        field: 'newPassword',
        code,
      });
    });

    it('aceita espaços e Unicode sem regras de composição', async () => {
      const user = await seedUser(context);
      const code = await seedAccessCode(context, user.id, 'activation');

      const response = await activate(code, 'ação de cidadania é um direito');

      expect(response.status).toBe(204);
      await expect(
        login('maria.silva', 'ação de cidadania é um direito'),
      ).resolves.toMatchObject({ status: 204 });
    });
  });

  describe('encerramento e expiração da sessão', () => {
    it('logout revoga a sessão e é idempotente', async () => {
      await activeUser();
      const { cookie, csrf } = await signIn('maria.silva');

      const out = await post(
        '/v1/auth/logout',
        {},
        { cookie, [CSRF_HEADER]: csrf },
      );
      expect(out.status).toBe(204);

      const after = await request(context.app)
        .get('/v1/auth/session')
        .set('cookie', cookie);
      expect(after.status).toBe(401);
      expect((await post('/v1/auth/logout', {}, { cookie })).status).toBe(204);
      expect((await post('/v1/auth/logout', {})).status).toBe(204);
    });

    it('logout com sessão válida exige o token CSRF', async () => {
      await activeUser();
      const { cookie } = await signIn('maria.silva');

      const response = await post('/v1/auth/logout', {}, { cookie });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('expira após 8 horas de inatividade e a atividade prolonga a sessão', async () => {
      await activeUser();
      const { cookie } = await signIn('maria.silva');
      const check = () =>
        request(context.app).get('/v1/auth/session').set('cookie', cookie);

      context.clock.advance(7 * HOUR);
      expect((await check()).status).toBe(200);
      context.clock.advance(7 * HOUR);
      expect((await check()).status).toBe(200);
      context.clock.advance(8 * HOUR + MINUTE);
      expect((await check()).status).toBe(401);
    });

    it('expira após 24 horas mesmo com atividade contínua', async () => {
      await activeUser();
      const { cookie } = await signIn('maria.silva');
      const check = () =>
        request(context.app).get('/v1/auth/session').set('cookie', cookie);

      for (let step = 0; step < 3; step += 1) {
        context.clock.advance(7 * HOUR);
        expect((await check()).status).toBe(200);
      }
      context.clock.advance(4 * HOUR);

      expect((await check()).status).toBe(401);
    });

    it('guarda apenas o hash do identificador da sessão', async () => {
      await activeUser();
      const { cookie } = await signIn('maria.silva');
      const token = cookie.split('=')[1]!;

      const { rows } = await context.pool.query(
        'SELECT token_hash FROM sessions',
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].token_hash).not.toContain(token);
    });
  });

  describe('efeito imediato de alterações', () => {
    it('reflete concessões e revogações de permissão na sessão aberta', async () => {
      const user = await activeUser({ permissions: ['partners.view'] });
      const { cookie } = await signIn('maria.silva');
      const read = async () =>
        (
          await request(context.app)
            .get('/v1/auth/session')
            .set('cookie', cookie)
        ).body.permissions;

      expect(await read()).toEqual(['partners.view']);
      await context.pool.query(
        "INSERT INTO user_permissions (user_id, permission) VALUES ($1, 'leads.create')",
        [user.id],
      );
      expect((await read()).sort()).toEqual(['leads.create', 'partners.view']);
      await context.pool.query(
        "DELETE FROM user_permissions WHERE user_id = $1 AND permission = 'partners.view'",
        [user.id],
      );
      expect(await read()).toEqual(['leads.create']);
    });

    it('rejeita imediatamente a sessão de uma conta desativada', async () => {
      const user = await activeUser();
      const { cookie } = await signIn('maria.silva');

      await context.pool.query(
        "UPDATE users SET status = 'inactive' WHERE id = $1",
        [user.id],
      );
      const response = await request(context.app)
        .get('/v1/auth/session')
        .set('cookie', cookie);

      expect(response.status).toBe(401);
    });
  });

  describe('alteração da própria senha', () => {
    const put = (
      auth: { cookie: string; csrf?: string },
      body: Record<string, string>,
    ) =>
      request(context.app)
        .put('/v1/auth/password')
        .set('origin', DASHBOARD_ORIGIN)
        .set('cookie', auth.cookie)
        .set(auth.csrf ? { [CSRF_HEADER]: auth.csrf } : {})
        .send(body);

    const NEW_PASSWORD = 'uma segunda frase longa e segura';
    const payload = (current = STRONG_PASSWORD) => ({
      currentPassword: current,
      newPassword: NEW_PASSWORD,
      newPasswordConfirmation: NEW_PASSWORD,
    });

    it('substitui a senha, mantém a sessão atual e encerra as demais', async () => {
      await activeUser();
      const current = await signIn('maria.silva');
      const other = await signIn('maria.silva');

      const response = await put(current, payload());

      expect(response.status).toBe(204);
      const stillValid = await request(context.app)
        .get('/v1/auth/session')
        .set('cookie', current.cookie);
      const revoked = await request(context.app)
        .get('/v1/auth/session')
        .set('cookie', other.cookie);
      expect(stillValid.status).toBe(200);
      expect(revoked.status).toBe(401);
      expect((await login('maria.silva', STRONG_PASSWORD)).status).toBe(401);
      expect((await login('maria.silva', NEW_PASSWORD)).status).toBe(204);
    });

    it('recusa senha atual incorreta sem alterar a credencial', async () => {
      await activeUser();
      const auth = await signIn('maria.silva');

      const response = await put(auth, payload('não é a senha atual correta'));

      expect(response.status).toBe(422);
      expect(response.body.errors[0]).toMatchObject({
        field: 'currentPassword',
        code: 'INVALID_CURRENT_PASSWORD',
      });
      expect((await login('maria.silva', STRONG_PASSWORD)).status).toBe(204);
    });

    it('aplica as regras de senha à nova senha', async () => {
      await activeUser();
      const auth = await signIn('maria.silva');

      const response = await put(auth, {
        currentPassword: STRONG_PASSWORD,
        newPassword: 'passwordpassword',
        newPasswordConfirmation: 'passwordpassword',
      });

      expect(response.status).toBe(422);
      expect(response.body.errors[0]).toMatchObject({
        field: 'newPassword',
        code: 'PASSWORD_TOO_COMMON',
      });
    });

    it('exige autenticação e token CSRF', async () => {
      await activeUser();
      const auth = await signIn('maria.silva');

      const anonymous = await request(context.app)
        .put('/v1/auth/password')
        .set('origin', DASHBOARD_ORIGIN)
        .send(payload());
      const withoutToken = await put({ cookie: auth.cookie }, payload());
      const wrongToken = await put(
        { cookie: auth.cookie, csrf: 'token-de-outra-sessao' },
        payload(),
      );

      expect(anonymous.status).toBe(401);
      expect(withoutToken.status).toBe(403);
      expect(wrongToken.status).toBe(403);
      expect(wrongToken.body.code).toBe('CSRF_VALIDATION_FAILED');
      expect((await put(auth, payload())).status).toBe(204);
    });
  });

  describe('recuperação de acesso', () => {
    const requestRecovery = (username: string) =>
      post('/v1/auth/recovery-requests', { username });

    it('responde 202 de forma idêntica para qualquer usuário', async () => {
      await activeUser({ username: 'com.email', email: 'a@exemplo.org' });
      await activeUser({ username: 'sem.email' });
      await activeUser({
        username: 'inativa',
        email: 'i@exemplo.org',
        status: 'inactive',
      });

      const responses = [];
      for (const username of [
        'com.email',
        'sem.email',
        'inativa',
        'inexistente',
      ]) {
        responses.push(await requestRecovery(username));
      }

      for (const response of responses) {
        expect(response.status).toBe(202);
        expect(response.body).toEqual(responses[0]!.body);
      }
    });

    it('envia o código somente para conta ativa com e-mail e permite redefinir a senha', async () => {
      await activeUser({ username: 'com.email', email: 'a@exemplo.org' });
      await activeUser({ username: 'sem.email' });
      const session = await signIn('com.email');

      await requestRecovery('sem.email');
      await requestRecovery('com.email');
      await vi.waitFor(() => expect(context.emailSender.sent).toHaveLength(1));

      expect(context.emailSender.sent[0]!.to).toBe('a@exemplo.org');
      const code = context.emailSender.lastCodeFor('a@exemplo.org')!;
      const newPassword = 'a senha nova depois da recuperação';
      const recover = await post('/v1/auth/recover', {
        code,
        newPassword,
        newPasswordConfirmation: newPassword,
      });

      expect(recover.status).toBe(204);
      expect(recover.headers['set-cookie']).toBeUndefined();
      expect((await login('com.email', newPassword)).status).toBe(204);
      const revoked = await request(context.app)
        .get('/v1/auth/session')
        .set('cookie', session.cookie);
      expect(revoked.status).toBe(401);
    });

    it('não aceita código de ativação na recuperação', async () => {
      const user = await seedUser(context);
      const code = await seedAccessCode(context, user.id, 'activation');

      const response = await post('/v1/auth/recover', {
        code,
        newPassword: STRONG_PASSWORD,
        newPasswordConfirmation: STRONG_PASSWORD,
      });

      expect(response.status).toBe(422);
    });

    it('permanece neutra e registra internamente quando o provedor de e-mail falha', async () => {
      await activeUser({ username: 'com.email', email: 'a@exemplo.org' });
      context.emailSender.failing = true;

      const response = await requestRecovery('com.email');

      expect(response.status).toBe(202);
      await vi.waitFor(() =>
        expect(
          context.logs
            .entries()
            .some((entry) => entry.msg?.includes('código de recuperação')),
        ).toBe(true),
      );
      expect(context.logs.lines.join('\n')).not.toContain('a@exemplo.org');
    });

    it('limita solicitações repetidas para o mesmo usuário', async () => {
      await activeUser({ username: 'com.email', email: 'a@exemplo.org' });

      const statuses = [];
      for (let attempt = 0; attempt < 5; attempt += 1) {
        statuses.push((await requestRecovery('com.email')).status);
      }

      expect(statuses.slice(0, 3)).toEqual([202, 202, 202]);
      expect(statuses.at(-1)).toBe(429);
    });
  });

  describe('proteções HTTP', () => {
    it('recusa operações mutáveis de origens não permitidas', async () => {
      await activeUser();

      const response = await request(context.app)
        .post('/v1/auth/login')
        .set('origin', 'https://site-malicioso.example')
        .send({ username: 'maria.silva', password: STRONG_PASSWORD });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('CSRF_VALIDATION_FAILED');
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('responde ao preflight somente para a origem do dashboard, com credenciais', async () => {
      const allowed = await request(context.app)
        .options('/v1/auth/login')
        .set('origin', DASHBOARD_ORIGIN)
        .set('access-control-request-method', 'POST');
      const denied = await request(context.app)
        .options('/v1/auth/login')
        .set('origin', 'https://site-malicioso.example')
        .set('access-control-request-method', 'POST');

      expect(allowed.status).toBe(204);
      expect(allowed.headers['access-control-allow-origin']).toBe(
        DASHBOARD_ORIGIN,
      );
      expect(allowed.headers['access-control-allow-credentials']).toBe('true');
      expect(allowed.headers['access-control-allow-headers']).toContain(
        CSRF_HEADER,
      );
      expect(denied.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('expõe o token CSRF ao dashboard e nunca usa curinga', async () => {
      await activeUser();
      const { cookie } = await signIn('maria.silva');

      const response = await request(context.app)
        .get('/v1/auth/session')
        .set('origin', DASHBOARD_ORIGIN)
        .set('cookie', cookie);

      expect(response.headers['access-control-allow-origin']).toBe(
        DASHBOARD_ORIGIN,
      );
      expect(response.headers['access-control-expose-headers']).toContain(
        CSRF_HEADER,
      );
    });

    it('bloqueia progressivamente tentativas de login sem revelar a existência da conta', async () => {
      await activeUser({ username: 'ativa' });

      const statuses = [];
      for (let attempt = 0; attempt < 6; attempt += 1) {
        statuses.push(
          (await login('ativa', 'senha errada de propósito')).status,
        );
      }
      const ghost = [];
      for (let attempt = 0; attempt < 6; attempt += 1) {
        ghost.push(
          (await login('fantasma', 'senha errada de propósito')).status,
        );
      }

      expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
      expect(ghost).toEqual(statuses);
      const blocked = await login('ativa', STRONG_PASSWORD);
      expect(blocked.status).toBe(429);
      expect(blocked.headers['retry-after']).toMatch(/^\d+$/);
      expect(problemDetailsSchema.parse(blocked.body).code).toBe(
        'RATE_LIMIT_EXCEEDED',
      );
    });

    it('um login bem-sucedido zera as tentativas anteriores', async () => {
      await activeUser({ username: 'ativa' });

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await login('ativa', 'senha errada de propósito');
      }
      expect((await login('ativa', STRONG_PASSWORD)).status).toBe(204);
      for (let attempt = 0; attempt < 4; attempt += 1) {
        expect((await login('ativa', 'senha errada de propósito')).status).toBe(
          401,
        );
      }
    });

    it('não registra senhas, códigos nem cookies nos logs', async () => {
      const user = await seedUser(context);
      const code = await seedAccessCode(context, user.id, 'activation');
      await activate(code);
      const { cookie } = await signIn('maria.silva');
      await login('maria.silva', 'senha errada que não deve vazar');
      await request(context.app)
        .put('/v1/auth/password')
        .set('origin', DASHBOARD_ORIGIN)
        .set('cookie', cookie)
        .send({ currentPassword: 'currentPassword-que-nao-deve-vazar' });

      const output = context.logs.lines.join('\n');
      expect(output).not.toContain(code);
      expect(output).not.toContain(STRONG_PASSWORD);
      expect(output).not.toContain('que não deve vazar');
      expect(output).not.toContain('nao-deve-vazar');
      expect(output).not.toContain(cookie.split('=')[1]!);
    });
  });
});
