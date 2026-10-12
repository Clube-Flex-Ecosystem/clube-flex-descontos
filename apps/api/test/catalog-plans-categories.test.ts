import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { problemDetailsSchema } from '@flex/contracts';
import {
  ALL_CATALOG_PERMISSIONS,
  createTestApp,
  resetDatabase,
  signIn,
  type SignedInSession,
} from './support';

describe('administração de planos e categorias', () => {
  const context = createTestApp();
  let session: SignedInSession;

  beforeEach(async () => {
    await resetDatabase(context.pool);
    session = await signIn(context, { permissions: ALL_CATALOG_PERMISSIONS });
  });
  afterAll(() => context.pool.end());

  const get = (path: string, s = session) =>
    request(context.app).get(path).set('cookie', s.cookie);
  const send = (
    method: 'post' | 'patch',
    path: string,
    body?: object,
    version?: number,
    s = session,
  ) => {
    const agent = request(context.app);
    const call = agent[method](path)
      .set('cookie', s.cookie)
      .set('x-csrf-token', s.csrf);
    if (version !== undefined) call.set('if-match', `"${version}"`);
    return call.send(body);
  };

  describe('planos', () => {
    it('cria o plano ativo com identificador público gerado e versão 1', async () => {
      const response = await send('post', '/v1/admin/plans', {
        name: 'Família',
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: 'Família',
        slug: 'familia',
        status: 'active',
        version: 1,
        deleted: false,
      });
      expect(response.headers.etag).toBe('"1"');
    });

    it('gera identificadores distintos para nomes que colidem', async () => {
      await send('post', '/v1/admin/plans', { name: 'Multi' });
      const second = await send('post', '/v1/admin/plans', { name: 'Multi!' });

      expect(second.body.slug).toBe('multi-2');
    });

    it('recusa nomes equivalentes após normalizar caixa e acentos (RN-030)', async () => {
      await send('post', '/v1/admin/plans', { name: 'Família' });

      const duplicate = await send('post', '/v1/admin/plans', {
        name: ' familia ',
      });

      expect(duplicate.status).toBe(409);
      const problem = problemDetailsSchema.parse(duplicate.body);
      expect(problem.code).toBe('DUPLICATE_RESOURCE');
      expect(problem.errors?.[0]).toMatchObject({
        field: 'name',
        code: 'DUPLICATE_NAME',
      });
    });

    it('valida o nome obrigatório', async () => {
      const response = await send('post', '/v1/admin/plans', { name: '   ' });

      expect(response.status).toBe(422);
      expect(response.body.errors[0]).toMatchObject({
        field: 'name',
        code: 'REQUIRED',
      });
    });

    it('renomear não altera o identificador público', async () => {
      const created = await send('post', '/v1/admin/plans', { name: 'Multi' });

      const renamed = await send(
        'patch',
        `/v1/admin/plans/${created.body.id}`,
        { name: 'Multi Plus' },
        1,
      );

      expect(renamed.status).toBe(200);
      expect(renamed.body).toMatchObject({
        name: 'Multi Plus',
        slug: 'multi',
        version: 2,
      });
      expect(renamed.headers.etag).toBe('"2"');
    });

    it('exige If-Match e recusa versão desatualizada sem alterar o recurso', async () => {
      const created = await send('post', '/v1/admin/plans', { name: 'Multi' });
      const url = `/v1/admin/plans/${created.body.id}`;
      await send('patch', url, { name: 'Multi Plus' }, 1);

      const missing = await send('patch', url, { name: 'Outro' });
      const stale = await send('patch', url, { name: 'Outro' }, 1);

      expect(missing.status).toBe(428);
      expect(missing.body.code).toBe('RESOURCE_VERSION_REQUIRED');
      expect(stale.status).toBe(409);
      expect(stale.body.code).toBe('RESOURCE_VERSION_CONFLICT');
      expect((await get(url)).body.name).toBe('Multi Plus');
    });

    it('desativa e reativa de forma idempotente, sem repetir efeitos', async () => {
      const created = await send('post', '/v1/admin/plans', { name: 'Multi' });
      const url = `/v1/admin/plans/${created.body.id}`;

      const off = await send('post', `${url}/deactivate`, undefined, 1);
      const offAgain = await send('post', `${url}/deactivate`, undefined, 2);
      const on = await send('post', `${url}/activate`, undefined, 2);

      expect(off.body).toMatchObject({ status: 'inactive', version: 2 });
      expect(offAgain.status).toBe(200);
      expect(offAgain.body.version).toBe(2);
      expect(on.body).toMatchObject({ status: 'active', version: 3 });
    });

    it('lista planos ativos e inativos em ordem alfabética', async () => {
      await send('post', '/v1/admin/plans', { name: 'Tradicional' });
      const multi = await send('post', '/v1/admin/plans', { name: 'Multi' });
      await send(
        'post',
        `/v1/admin/plans/${multi.body.id}/deactivate`,
        undefined,
        1,
      );

      const list = await get('/v1/admin/plans');

      expect(list.body.map((p: { name: string }) => p.name)).toEqual([
        'Multi',
        'Tradicional',
      ]);
      expect(list.body[0].status).toBe('inactive');
    });

    it('responde 404 para identificador inexistente ou malformado', async () => {
      expect((await get(`/v1/admin/plans/${crypto.randomUUID()}`)).status).toBe(
        404,
      );
      expect((await get('/v1/admin/plans/nao-e-uuid')).status).toBe(404);
    });

    it('exige sessão e as permissões de visualização e administração', async () => {
      const anonymous = await request(context.app).get('/v1/admin/plans');
      const viewer = await signIn(context, {
        username: 'leitor',
        fullName: 'Leitor',
        permissions: ['plans.view'],
      });

      const view = await get('/v1/admin/plans', viewer);
      const create = await send(
        'post',
        '/v1/admin/plans',
        { name: 'Multi' },
        undefined,
        viewer,
      );

      expect(anonymous.status).toBe(401);
      expect(view.status).toBe(200);
      expect(create.status).toBe(403);
      expect(create.body.code).toBe('PERMISSION_DENIED');
    });
  });

  describe('categorias', () => {
    it('cria, renomeia e desativa preservando a unicidade normalizada', async () => {
      const created = await send('post', '/v1/admin/categories', {
        name: 'Saúde',
      });
      const duplicate = await send('post', '/v1/admin/categories', {
        name: 'SAUDE',
      });
      const renamed = await send(
        'patch',
        `/v1/admin/categories/${created.body.id}`,
        { name: 'Saúde e bem-estar' },
        1,
      );
      const off = await send(
        'post',
        `/v1/admin/categories/${created.body.id}/deactivate`,
        undefined,
        2,
      );

      expect(created.status).toBe(201);
      expect(duplicate.status).toBe(409);
      expect(renamed.body).toMatchObject({
        name: 'Saúde e bem-estar',
        version: 2,
      });
      expect(off.body).toMatchObject({ status: 'inactive', version: 3 });
    });

    it('recusa renomear para um nome já usado por outra categoria', async () => {
      await send('post', '/v1/admin/categories', { name: 'Saúde' });
      const other = await send('post', '/v1/admin/categories', {
        name: 'Beleza',
      });

      const response = await send(
        'patch',
        `/v1/admin/categories/${other.body.id}`,
        { name: 'saude' },
        1,
      );

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('DUPLICATE_RESOURCE');
    });

    it('exige a permissão correspondente', async () => {
      const viewer = await signIn(context, {
        username: 'leitor',
        fullName: 'Leitor',
        permissions: ['plans.view'],
      });

      const response = await get('/v1/admin/categories', viewer);

      expect(response.status).toBe(403);
    });
  });
});
