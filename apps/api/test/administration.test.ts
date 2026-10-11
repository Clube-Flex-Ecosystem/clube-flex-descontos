import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { Permission } from '@flex/contracts';
import {
  createTestApp,
  DASHBOARD_ORIGIN,
  resetDatabase,
  seedUser,
  signIn,
  STRONG_PASSWORD,
  type SignedInSession,
} from './support';

const ADMIN: Permission[] = [
  'users.view',
  'users.manage',
  'users.set-status',
  'users.reset-access',
  'permissions.view',
  'permissions.manage',
  'audit.view',
];

describe('administração de usuários, permissões e auditoria', () => {
  const context = createTestApp();
  beforeEach(() => resetDatabase(context.pool));
  afterAll(() => context.pool.end());

  const write = (session: SignedInSession) => ({
    cookie: session.cookie,
    origin: DASHBOARD_ORIGIN,
    'x-csrf-token': session.csrf,
  });

  async function createUser(
    session: SignedInSession,
    body: { fullName: string; email?: string },
  ) {
    const response = await request(context.app)
      .post('/v1/admin/users')
      .set(write(session))
      .send(body);
    expect(response.status).toBe(201);
    return response.body as {
      id: string;
      username: string;
      version: number;
      accessCode?: string;
      accessCodeDelivery: string;
      warnings?: string[];
    };
  }

  /** Concede por HTTP as permissões desejadas (o autor precisa possuí-las). */
  async function grant(
    session: SignedInSession,
    user: { id: string; version: number },
    permissions: Permission[],
  ) {
    return request(context.app)
      .put(`/v1/admin/users/${user.id}/permissions`)
      .set(write(session))
      .set('if-match', `"${user.version}"`)
      .send({ permissions });
  }

  describe('contas', () => {
    it('cria conta ativa, sem permissões, e entrega o código manualmente sem e-mail', async () => {
      const admin = await signIn(context, { permissions: ADMIN });
      const created = await createUser(admin, { fullName: 'João da Silva' });

      expect(created).toMatchObject({
        username: 'joao.da.silva',
        status: 'active',
        accessStatus: 'pendingActivation',
        permissions: [],
        version: 1,
        deleted: false,
        accessCodeDelivery: 'manual',
      });
      expect(created.accessCode).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/);

      // O código só aparece na resposta que o emitiu.
      const read = await request(context.app)
        .get(`/v1/admin/users/${created.id}`)
        .set('cookie', admin.cookie)
        .expect(200);
      expect(read.body.accessCode).toBeUndefined();
      expect(read.headers.etag).toBe('"1"');
    });

    it('resolve colisões de nome de usuário com sufixo sequencial', async () => {
      const admin = await signIn(context, { permissions: ADMIN });
      await createUser(admin, { fullName: 'Ana Souza' });
      const second = await createUser(admin, { fullName: 'Ana Souza' });
      const third = await createUser(admin, { fullName: 'Ana  Souza' });

      expect(second.username).toBe('ana.souza.2');
      expect(third.username).toBe('ana.souza.3');
    });

    it('envia o código por e-mail sem expô-lo e cai no fluxo manual quando o envio falha', async () => {
      const admin = await signIn(context, { permissions: ADMIN });
      const emailed = await createUser(admin, {
        fullName: 'Com Email',
        email: 'com.email@exemplo.com',
      });
      expect(emailed.accessCodeDelivery).toBe('email');
      expect(emailed.accessCode).toBeUndefined();
      expect(
        context.emailSender.lastCodeFor('com.email@exemplo.com'),
      ).toBeDefined();

      context.emailSender.failing = true;
      const failed = await createUser(admin, {
        fullName: 'Falha Email',
        email: 'falha@exemplo.com',
      });
      expect(failed.accessCodeDelivery).toBe('manual');
      expect(failed.accessCode).toBeDefined();
      expect(failed.warnings).toEqual(['EMAIL_DELIVERY_FAILED']);
    });

    it('edita dados com controle de versão e valida unicidade do nome de usuário', async () => {
      const admin = await signIn(context, { permissions: ADMIN });
      const a = await createUser(admin, { fullName: 'Pessoa Um' });
      const b = await createUser(admin, { fullName: 'Pessoa Dois' });

      const updated = await request(context.app)
        .patch(`/v1/admin/users/${a.id}`)
        .set(write(admin))
        .set('if-match', '"1"')
        .send({ fullName: 'Pessoa Uma', username: 'Pessoa.UMA', email: '' })
        .expect(200);
      expect(updated.body).toMatchObject({
        fullName: 'Pessoa Uma',
        username: 'pessoa.uma',
        version: 2,
      });

      await request(context.app)
        .patch(`/v1/admin/users/${a.id}`)
        .set(write(admin))
        .set('if-match', '"1"')
        .send({ fullName: 'Pessoa Uma', username: 'pessoa.uma' })
        .expect(409)
        .expect(({ body }) =>
          expect(body.code).toBe('RESOURCE_VERSION_CONFLICT'),
        );

      await request(context.app)
        .patch(`/v1/admin/users/${a.id}`)
        .set(write(admin))
        .set('if-match', '"2"')
        .send({ fullName: 'Pessoa Uma', username: b.username })
        .expect(422)
        .expect(({ body }) =>
          expect(body.errors[0]).toMatchObject({
            field: 'username',
            code: 'DUPLICATE_USERNAME',
          }),
        );

      await request(context.app)
        .patch(`/v1/admin/users/${a.id}`)
        .set(write(admin))
        .send({ fullName: 'X', username: 'x.y' })
        .expect(428);
    });

    it('exige a permissão específica de cada operação', async () => {
      const viewer = await signIn(context, { permissions: ['users.view'] });
      const target = await seedUser(context, { username: 'alvo' });

      await request(context.app)
        .post('/v1/admin/users')
        .set(write(viewer))
        .send({ fullName: 'Nova Pessoa' })
        .expect(403);
      await request(context.app)
        .post(`/v1/admin/users/${target.id}/deactivate`)
        .set(write(viewer))
        .set('if-match', '"1"')
        .expect(403);
      await request(context.app)
        .post(`/v1/admin/users/${target.id}/access-codes`)
        .set(write(viewer))
        .send({ purpose: 'activation' })
        .expect(403);
      await request(context.app)
        .get('/v1/admin/permissions')
        .set('cookie', viewer.cookie)
        .expect(403);
      await request(context.app)
        .get('/v1/admin/audit-events')
        .set('cookie', viewer.cookie)
        .expect(403);
    });
  });

  describe('códigos de acesso', () => {
    it('só emite a finalidade compatível com a situação da conta', async () => {
      const admin = await signIn(context, { permissions: ADMIN });
      const pending = await createUser(admin, { fullName: 'Pendente' });

      await request(context.app)
        .post(`/v1/admin/users/${pending.id}/access-codes`)
        .set(write(admin))
        .send({ purpose: 'recovery' })
        .expect(409)
        .expect(({ body }) => expect(body.code).toBe('INVALID_RESOURCE_STATE'));

      const activated = await seedUser(context, {
        username: 'ativada',
        password: STRONG_PASSWORD,
      });
      await request(context.app)
        .post(`/v1/admin/users/${activated.id}/access-codes`)
        .set(write(admin))
        .send({ purpose: 'activation' })
        .expect(409);
    });

    it('invalida o código anterior e exige a senha nova após a recuperação administrativa', async () => {
      const admin = await signIn(context, { permissions: ADMIN });
      const target = await seedUser(context, {
        username: 'sem.email',
        password: STRONG_PASSWORD,
      });

      const first = await request(context.app)
        .post(`/v1/admin/users/${target.id}/access-codes`)
        .set(write(admin))
        .send({ purpose: 'recovery' })
        .expect(201);
      expect(first.body).toMatchObject({
        accessStatus: 'passwordChangeRequired',
        accessCodeDelivery: 'manual',
      });
      const second = await request(context.app)
        .post(`/v1/admin/users/${target.id}/access-codes`)
        .set(write(admin))
        .send({ purpose: 'recovery' })
        .expect(201);

      // A senha anterior deixa de permitir o acesso (CA-RF-015-11).
      await request(context.app)
        .post('/v1/auth/login')
        .set('origin', DASHBOARD_ORIGIN)
        .send({ username: 'sem.email', password: STRONG_PASSWORD })
        .expect(401);

      // O primeiro código foi invalidado pela nova emissão.
      await request(context.app)
        .post('/v1/auth/recover')
        .set('origin', DASHBOARD_ORIGIN)
        .send({
          code: first.body.accessCode,
          newPassword: 'outra frase longa e segura 2026',
          newPasswordConfirmation: 'outra frase longa e segura 2026',
        })
        .expect(422);
      await request(context.app)
        .post('/v1/auth/recover')
        .set('origin', DASHBOARD_ORIGIN)
        .send({
          code: second.body.accessCode,
          newPassword: 'outra frase longa e segura 2026',
          newPasswordConfirmation: 'outra frase longa e segura 2026',
        })
        .expect(204);

      await request(context.app)
        .post('/v1/auth/login')
        .set('origin', DASHBOARD_ORIGIN)
        .send({
          username: 'sem.email',
          password: 'outra frase longa e segura 2026',
        })
        .expect(204);
      const read = await request(context.app)
        .get(`/v1/admin/users/${target.id}`)
        .set('cookie', admin.cookie);
      expect(read.body.accessStatus).toBe('active');
    });
  });

  describe('permissões', () => {
    it('substitui as permissões, vale de imediato e registra antes e depois', async () => {
      const admin = await signIn(context, {
        permissions: [...ADMIN, 'partners.view'],
      });
      const user = await signIn(context, {
        username: 'operadora',
        permissions: [],
      });
      const { body: list } = await request(context.app)
        .get('/v1/admin/users')
        .set('cookie', admin.cookie)
        .expect(200);
      const operator = list.find(
        (entry: { username: string }) => entry.username === 'operadora',
      );
      expect(operator.permissions).toEqual([]);

      // Sem permissão, a listagem de parceiros é recusada para a sessão já aberta.
      await request(context.app)
        .get('/v1/admin/partners')
        .set('cookie', user.cookie)
        .expect(403);

      const granted = await grant(admin, operator, [
        'partners.view',
        'users.view',
      ]);
      expect(granted.status).toBe(200);
      expect(granted.body).toMatchObject({
        permissions: ['partners.view', 'users.view'],
        version: 2,
      });

      await request(context.app)
        .get('/v1/admin/partners')
        .set('cookie', user.cookie)
        .expect(200);

      const events = await request(context.app)
        .get('/v1/admin/audit-events')
        .query({ action: 'user.permissions.updated' })
        .set('cookie', admin.cookie)
        .expect(200);
      expect(events.body.items[0]).toMatchObject({
        action: 'user.permissions.updated',
        actor: { username: 'maria.silva' },
        target: { type: 'user', label: 'operadora' },
        before: { permissions: [] },
        after: { permissions: ['partners.view', 'users.view'] },
      });
    });

    it('recusa a autoalteração e a concessão de permissão que o autor não possui', async () => {
      const admin = await signIn(context, {
        permissions: ['users.view', 'permissions.manage', 'partners.view'],
      });
      const me = await request(context.app)
        .get('/v1/auth/session')
        .set('cookie', admin.cookie);
      const self = await request(context.app)
        .get(`/v1/admin/users/${me.body.user.id}`)
        .set('cookie', admin.cookie);

      await grant(admin, self.body, ['users.view']).then((response) => {
        expect(response.status).toBe(409);
        expect(response.body.code).toBe('PROTECTED_RESOURCE');
      });

      const target = await seedUser(context, { username: 'alvo' });
      await grant(admin, { id: target.id, version: 1 }, [
        'partners.view',
        'leads.delete',
      ]).then((response) => {
        expect(response.status).toBe(409);
        expect(response.body.code).toBe('PROTECTED_RESOURCE');
        expect(response.body.detail).toContain('leads.delete');
      });
      await grant(admin, { id: target.id, version: 1 }, ['partners.view']).then(
        (response) => expect(response.status).toBe(200),
      );
    });

    it('impede deixar o sistema sem administrador e desativar o último', async () => {
      const manager = await signIn(context, {
        username: 'gestora',
        permissions: ['users.view', 'users.set-status', 'permissions.manage'],
      });
      const only = await seedUser(context, {
        username: 'unico.admin',
        password: STRONG_PASSWORD,
        permissions: ['users.manage', 'permissions.manage'],
      });
      const accountOf = async (id: string) =>
        (
          await request(context.app)
            .get(`/v1/admin/users/${id}`)
            .set('cookie', manager.cookie)
        ).body as { id: string; version: number };

      await request(context.app)
        .post(`/v1/admin/users/${only.id}/deactivate`)
        .set(write(manager))
        .set('if-match', '"1"')
        .expect(409)
        .expect(({ body }) => {
          expect(body.code).toBe('PROTECTED_RESOURCE');
          expect(body.detail).toContain('último administrador');
        });
      // Revogar a capacidade de administrar usuários também é recusado.
      await grant(manager, await accountOf(only.id), [
        'permissions.manage',
      ]).then((response) => {
        expect(response.status).toBe(409);
        expect(response.body.code).toBe('PROTECTED_RESOURCE');
      });

      // Com outro administrador ativo e apto, a desativação é aceita.
      await seedUser(context, {
        username: 'segundo.admin',
        password: STRONG_PASSWORD,
        permissions: ['users.manage', 'permissions.manage'],
      });
      await request(context.app)
        .post(`/v1/admin/users/${only.id}/deactivate`)
        .set(write(manager))
        .set('if-match', '"1"')
        .expect(200);
    });
  });

  describe('estado da conta', () => {
    it('desativa, revoga as sessões e permite reativar', async () => {
      const admin = await signIn(context, { permissions: ADMIN });
      const operator = await signIn(context, {
        username: 'operadora',
        permissions: ['partners.view'],
      });
      await request(context.app)
        .get('/v1/admin/partners')
        .set('cookie', operator.cookie)
        .expect(200);

      const { body: users } = await request(context.app)
        .get('/v1/admin/users')
        .set('cookie', admin.cookie);
      const target = users.find(
        (entry: { username: string }) => entry.username === 'operadora',
      );
      const deactivated = await request(context.app)
        .post(`/v1/admin/users/${target.id}/deactivate`)
        .set(write(admin))
        .set('if-match', `"${target.version}"`)
        .expect(200);
      expect(deactivated.body).toMatchObject({
        status: 'inactive',
        version: 2,
      });

      await request(context.app)
        .get('/v1/admin/partners')
        .set('cookie', operator.cookie)
        .expect(401);
      await request(context.app)
        .post('/v1/auth/login')
        .set('origin', DASHBOARD_ORIGIN)
        .send({ username: 'operadora', password: STRONG_PASSWORD })
        .expect(401);

      // Repetir a mesma operação é idempotente.
      await request(context.app)
        .post(`/v1/admin/users/${target.id}/deactivate`)
        .set(write(admin))
        .set('if-match', '"1"')
        .expect(200)
        .expect(({ body }) => expect(body.version).toBe(2));

      await request(context.app)
        .post(`/v1/admin/users/${target.id}/activate`)
        .set(write(admin))
        .set('if-match', '"2"')
        .expect(200)
        .expect(({ body }) => expect(body.status).toBe('active'));
      await request(context.app)
        .post('/v1/auth/login')
        .set('origin', DASHBOARD_ORIGIN)
        .send({ username: 'operadora', password: STRONG_PASSWORD })
        .expect(204);
    });
  });

  describe('auditoria', () => {
    it('lista do mais recente ao mais antigo, filtra, pagina e nunca expõe o código', async () => {
      const admin = await signIn(context, { permissions: ADMIN });
      const first = await createUser(admin, { fullName: 'Primeira Pessoa' });
      await createUser(admin, { fullName: 'Segunda Pessoa' });
      context.clock.advance(1000);
      await request(context.app)
        .post(`/v1/admin/users/${first.id}/deactivate`)
        .set(write(admin))
        .set('if-match', '"1"')
        .expect(200);

      const all = await request(context.app)
        .get('/v1/admin/audit-events')
        .set('cookie', admin.cookie)
        .expect(200);
      expect(all.body).toMatchObject({ page: 1, pageSize: 50, total: 5 });
      expect(all.body.items[0].action).toBe('user.deactivated');
      const times = all.body.items.map((e: { occurredAt: string }) =>
        Date.parse(e.occurredAt),
      );
      expect([...times].sort((a, b) => b - a)).toEqual(times);
      expect(JSON.stringify(all.body)).not.toContain(first.accessCode);

      const byTarget = await request(context.app)
        .get('/v1/admin/audit-events')
        .query({ targetId: first.id })
        .set('cookie', admin.cookie);
      expect(byTarget.body.total).toBe(3);

      const paged = await request(context.app)
        .get('/v1/admin/audit-events')
        .query({ page: 2, pageSize: 2 })
        .set('cookie', admin.cookie);
      expect(paged.body.items).toHaveLength(2);
      expect(paged.body.total).toBe(5);

      const detail = await request(context.app)
        .get(`/v1/admin/audit-events/${all.body.items[0].id}`)
        .set('cookie', admin.cookie)
        .expect(200);
      expect(detail.body.before).toEqual({ status: 'active' });

      await request(context.app)
        .get('/v1/admin/audit-events')
        .query({ pageSize: 101 })
        .set('cookie', admin.cookie)
        .expect(422);
      await request(context.app)
        .get('/v1/admin/audit-events/00000000-0000-4000-8000-000000000000')
        .set('cookie', admin.cookie)
        .expect(404);
    });

    it('é imutável no banco e não expõe rotas de escrita', async () => {
      const admin = await signIn(context, { permissions: ADMIN });
      await createUser(admin, { fullName: 'Pessoa' });
      await expect(
        context.pool.query("UPDATE audit_events SET action = 'x'"),
      ).rejects.toThrow(/imutáveis/);
      await expect(
        context.pool.query('DELETE FROM audit_events'),
      ).rejects.toThrow(/imutáveis/);

      const [row] = (
        await context.pool.query<{ id: string }>(
          'SELECT id FROM audit_events LIMIT 1',
        )
      ).rows;
      await request(context.app)
        .delete(`/v1/admin/audit-events/${row!.id}`)
        .set(write(admin))
        .expect(404);
    });
  });

  describe('exclusão ou anonimização de lead', () => {
    async function createLead(
      session: SignedInSession,
      whatsapp: string,
      name = 'Contato Real',
    ) {
      const source = await request(context.app)
        .post('/v1/admin/lead-sources')
        .set(write(session))
        .send({ name: `Abordagem ${whatsapp}`, requiresReferral: false });
      const lead = await request(context.app)
        .post('/v1/admin/leads')
        .set(write(session))
        .send({
          name,
          whatsapp,
          email: 'real@exemplo.com',
          sourceId: source.body.id,
          leaveUnassigned: false,
        })
        .expect(201);
      return lead.body as { id: string; version: number };
    }

    const privileged: Permission[] = [
      'leads.view-all',
      'leads.create',
      'leads.update',
      'leads.change-stage',
      'leads.delete',
      'sources.manage',
      'audit.view',
    ];

    it('exclui o lead que não possui histórico operacional ou dependências', async () => {
      const session = await signIn(context, { permissions: privileged });
      const lead = await createLead(session, '+5521999990001');

      const removed = await request(context.app)
        .delete(`/v1/admin/leads/${lead.id}`)
        .set(write(session))
        .set('if-match', `"${lead.version}"`)
        .expect(200);
      expect(removed.body).toMatchObject({
        id: lead.id,
        name: 'Contato Real',
        deleted: true,
        anonymized: false,
      });

      await request(context.app)
        .get(`/v1/admin/leads/${lead.id}`)
        .set('cookie', session.cookie)
        .expect(404);
      const count = await context.pool.query(
        'SELECT count(*)::int AS n FROM lead_history WHERE lead_id = $1',
        [lead.id],
      );
      expect(count.rows[0].n).toBe(0);
    });

    it('anonimiza o lead com histórico, libera o WhatsApp e não deixa dados pessoais na auditoria', async () => {
      const session = await signIn(context, { permissions: privileged });
      const lead = await createLead(session, '+5521999990002');
      const observed = await request(context.app)
        .post(`/v1/admin/leads/${lead.id}/observations`)
        .set(write(session))
        .set('if-match', `"${lead.version}"`)
        .send({ text: 'Prefere contato à tarde.' })
        .expect(201);

      const result = await request(context.app)
        .delete(`/v1/admin/leads/${lead.id}`)
        .set(write(session))
        .set('if-match', `"${observed.body.version}"`)
        .expect(200);
      expect(result.body).toMatchObject({
        id: lead.id,
        name: 'Lead anonimizado',
        deleted: false,
        anonymized: true,
      });
      expect(result.body.email).toBeUndefined();
      expect(result.body.whatsapp).not.toContain('99999');
      expect(result.body.observations).toHaveLength(1);

      // Sai do pipeline e não aceita novas alterações.
      const list = await request(context.app)
        .get('/v1/admin/leads')
        .set('cookie', session.cookie);
      expect(list.body).toEqual([]);
      await request(context.app)
        .post(`/v1/admin/leads/${lead.id}/stage-transitions`)
        .set(write(session))
        .set('if-match', `"${result.body.version}"`)
        .send({ stage: 'negotiating' })
        .expect(409);

      // Um novo envio voluntário gera outro lead para a mesma pessoa (RNF-008).
      const consent = await request(context.app)
        .get('/v1/public/contact-consent')
        .expect(200);
      await request(context.app)
        .post('/v1/public/contact-requests')
        .send({
          name: 'Contato Real',
          whatsapp: '+5521999990002',
          consent: true,
          consentVersion: consent.body.version,
          source: 'catalog',
        })
        .expect(202);
      const again = await request(context.app)
        .get('/v1/admin/leads')
        .set('cookie', session.cookie);
      expect(again.body).toHaveLength(1);
      expect(again.body[0].id).not.toBe(lead.id);

      const events = await request(context.app)
        .get('/v1/admin/audit-events')
        .query({ action: 'lead.anonymized' })
        .set('cookie', session.cookie)
        .expect(200);
      expect(events.body.total).toBe(1);
      const serialized = JSON.stringify(events.body);
      expect(serialized).not.toContain('Contato Real');
      expect(serialized).not.toContain('99999');
      expect(serialized).not.toContain('real@exemplo.com');
    });

    it('exige a permissão e a versão corretas', async () => {
      const session = await signIn(context, {
        permissions: ['leads.view-all', 'leads.create', 'sources.manage'],
      });
      const lead = await createLead(session, '+5521999990003');
      await request(context.app)
        .delete(`/v1/admin/leads/${lead.id}`)
        .set(write(session))
        .set('if-match', `"${lead.version}"`)
        .expect(403);

      const admin = await signIn(context, {
        username: 'quem.exclui',
        permissions: ['leads.view-all', 'leads.delete'],
      });
      await request(context.app)
        .delete(`/v1/admin/leads/${lead.id}`)
        .set(write(admin))
        .set('if-match', '"9"')
        .expect(409);
      await request(context.app)
        .delete(`/v1/admin/leads/${lead.id}`)
        .set(write(admin))
        .expect(428);
    });
  });
});
