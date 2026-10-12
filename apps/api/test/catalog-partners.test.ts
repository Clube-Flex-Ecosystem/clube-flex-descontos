import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
    ALL_CATALOG_PERMISSIONS,
    createTestApp,
    resetDatabase,
    signIn,
    type SignedInSession,
} from './support';

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe('administração de parceiros', () => {
    const context = createTestApp();
    let session: SignedInSession;
    let planId: string;
    let secondPlanId: string;
    let categoryId: string;

    const get = (path: string, s = session) =>
        request(context.app).get(path).set('cookie', s.cookie);
    const send = (
        method: 'post' | 'put' | 'patch' | 'delete',
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

    beforeEach(async () => {
        await resetDatabase(context.pool);
        session = await signIn(context, {
            permissions: ALL_CATALOG_PERMISSIONS,
        });
        planId = (
            await send('post', '/v1/admin/plans', { name: 'Tradicional' })
        ).body.id;
        secondPlanId = (
            await send('post', '/v1/admin/plans', { name: 'Multi' })
        ).body.id;
        categoryId = (
            await send('post', '/v1/admin/categories', { name: 'Saúde' })
        ).body.id;
    });
    afterAll(() => context.pool.end());

    /** Representação completa e publicável; `overrides` ajusta cada cenário. */
    const completeBody = (overrides: Json = {}): Json => ({
        name: 'Clínica Vida',
        description: 'Atendimento clínico.',
        usageInstructions: 'Apresente a carteirinha.',
        website: 'https://vida.example.com',
        featured: false,
        generalCoupon: ' FLEXVIDA ',
        categoryIds: [categoryId],
        contacts: [
            { type: 'whatsapp', value: '(21) 99876-5432', label: 'Agenda' },
        ],
        units: [
            {
                name: 'Unidade Tijuca',
                address: {
                    postalCode: '20520-054',
                    street: 'Rua Conde de Bonfim',
                    number: '420',
                    neighborhood: 'Tijuca',
                    city: 'Rio de Janeiro',
                    state: 'RJ',
                },
                openingHours: 'Seg. a sex., 8h às 18h',
                contacts: [{ type: 'phone', value: '21 3344-2100' }],
            },
        ],
        benefits: [{ planId, discountPercentage: 20, coupon: ' VIDA20 ' }],
        ...overrides,
    });

    const create = async (overrides: Json = {}) =>
        send('post', '/v1/admin/partners', completeBody(overrides));

    /** PUT com a representação atual do servidor como base. */
    const replace = (partner: Json, changes: Json = {}, version?: number) => {
        const editable = {
            name: partner.name,
            slug: partner.slug,
            description: partner.description,
            usageInstructions: partner.usageInstructions,
            website: partner.website,
            featured: partner.featured,
            generalCoupon: partner.generalCoupon,
            categoryIds: partner.categories.map((c: Json) => c.id),
            contacts: partner.contacts,
            units: partner.units,
            benefits: partner.benefits,
            ...changes,
        };
        return send(
            'put',
            `/v1/admin/partners/${partner.id}`,
            editable,
            version ?? partner.version,
        );
    };

    describe('cadastro', () => {
        it('cria o parceiro como rascunho com o agregado completo normalizado', async () => {
            const response = await create();

            expect(response.status).toBe(201);
            expect(response.headers.etag).toBe('"1"');
            expect(response.body).toMatchObject({
                name: 'Clínica Vida',
                slug: 'clinica-vida',
                status: 'draft',
                featured: false,
                generalCoupon: 'FLEXVIDA',
                version: 1,
                deleted: false,
                categories: [
                    { id: categoryId, name: 'Saúde', status: 'active' },
                ],
                contacts: [
                    {
                        type: 'whatsapp',
                        value: '+5521998765432',
                        label: 'Agenda',
                    },
                ],
                benefits: [
                    { planId, discountPercentage: 20, coupon: 'VIDA20' },
                ],
            });
            expect(response.body.units[0]).toMatchObject({
                name: 'Unidade Tijuca',
                status: 'active',
                address: { postalCode: '20520054', state: 'RJ' },
                contacts: [{ type: 'phone', value: '+552133442100' }],
            });
            expect(response.body.warnings).toBeUndefined();
        });

        it('aceita rascunho mínimo, sem unidade, contato ou benefício', async () => {
            const response = await send('post', '/v1/admin/partners', {
                name: 'Rascunho',
                categoryIds: [],
                contacts: [],
                units: [],
                benefits: [],
            });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('draft');
        });

        it('alerta sobre possível duplicidade sem impedir o salvamento (RN-031)', async () => {
            await create();

            const second = await create({ name: 'CLINICA  vida' });

            expect(second.status).toBe(201);
            expect(second.body.warnings).toEqual([
                'POSSIBLE_DUPLICATE_PARTNER',
            ]);
            expect(second.body.slug).toBe('clinica-vida-2');
        });

        it('localiza erros de contato, unidade, site e benefício', async () => {
            const response = await create({
                website: 'vida.example.com',
                contacts: [{ type: 'phone', value: '123' }],
                units: [
                    {
                        name: 'Sem endereço',
                        address: {
                            postalCode: '1',
                            street: '',
                            number: '',
                            neighborhood: '',
                            city: '',
                            state: 'SP',
                        },
                        contacts: [],
                    },
                ],
                benefits: [{ planId, discountPercentage: 0 }],
            });

            expect(response.status).toBe(422);
            const fields = Object.fromEntries(
                response.body.errors.map((e: Json) => [e.field, e.code]),
            );
            expect(fields).toMatchObject({
                website: 'INVALID_URL',
                'contacts.0.value': 'INVALID_PHONE_NUMBER',
                'units.0.address.postalCode': 'INVALID_POSTAL_CODE',
                'units.0.address.street': 'REQUIRED',
                'units.0.address.state': 'INVALID_STATE',
                'benefits.0.discountPercentage': 'INVALID_PERCENTAGE',
            });
            expect((await get('/v1/admin/partners')).body).toEqual([]);
        });

        it('recusa mais de um benefício para o mesmo plano', async () => {
            const response = await create({
                benefits: [
                    { planId, discountPercentage: 10 },
                    { planId, discountPercentage: 20 },
                ],
            });

            expect(response.status).toBe(422);
            expect(response.body.errors[0]).toMatchObject({
                field: 'benefits.1.planId',
                code: 'DUPLICATE_PLAN_BENEFIT',
            });
        });

        it('recusa categoria ou plano inexistente e plano inativo nas novas associações', async () => {
            const off = await send(
                'post',
                `/v1/admin/plans/${secondPlanId}/deactivate`,
                undefined,
                1,
            );
            expect(off.status).toBe(200);

            const response = await create({
                categoryIds: [crypto.randomUUID()],
                benefits: [{ planId: secondPlanId, discountPercentage: 10 }],
            });

            expect(response.status).toBe(422);
            const codes = Object.fromEntries(
                response.body.errors.map((e: Json) => [e.field, e.code]),
            );
            expect(codes).toEqual({
                'categoryIds.0': 'UNKNOWN_REFERENCE',
                'benefits.0.planId': 'INACTIVE_REFERENCE',
            });
            expect((await get('/v1/admin/partners')).body).toEqual([]);
        });
    });

    describe('edição atômica do agregado', () => {
        it('substitui o agregado completo, preservando os itens identificados', async () => {
            const created = (await create()).body;
            const unit = created.units[0];

            const updated = await replace(created, {
                name: 'Clínica Vida Plena',
                featured: true,
                units: [
                    {
                        ...unit,
                        openingHours: 'Todos os dias',
                        contacts: [
                            ...unit.contacts,
                            { type: 'whatsapp', value: '21 98888-7777' },
                        ],
                    },
                ],
                benefits: [
                    { planId, discountPercentage: 25 },
                    {
                        planId: secondPlanId,
                        discountPercentage: 10,
                        coupon: 'MULTI10',
                    },
                ],
            });

            expect(updated.status).toBe(200);
            expect(updated.body).toMatchObject({
                name: 'Clínica Vida Plena',
                slug: 'clinica-vida',
                featured: true,
                version: 2,
            });
            expect(updated.body.units).toHaveLength(1);
            expect(updated.body.units[0].id).toBe(unit.id);
            expect(updated.body.units[0].openingHours).toBe('Todos os dias');
            expect(updated.body.units[0].contacts).toHaveLength(2);
            expect(updated.body.units[0].contacts[0].id).toBe(
                unit.contacts[0].id,
            );
            expect(updated.body.contacts[0].id).toBe(created.contacts[0].id);
            expect(updated.body.benefits).toHaveLength(2);
        });

        it('a ausência de um item existente solicita sua remoção', async () => {
            const created = (await create()).body;

            const updated = await replace(created, {
                units: [],
                contacts: [{ type: 'phone', value: '21 3344-2100' }],
                benefits: [],
            });

            expect(updated.status).toBe(200);
            expect(updated.body.units).toEqual([]);
            expect(updated.body.benefits).toEqual([]);
            expect(updated.body.contacts).toHaveLength(1);
            expect(updated.body.contacts[0].type).toBe('phone');
        });

        it('uma entrada inválida não altera parcialmente o agregado', async () => {
            const created = (await create()).body;

            const invalid = await replace(created, {
                name: 'Nome novo',
                featured: true,
                contacts: [{ type: 'phone', value: '99' }],
                units: [{ ...created.units[0], name: 'Outro nome' }],
            });
            const unknown = await replace(created, {
                name: 'Nome novo',
                categoryIds: [crypto.randomUUID()],
            });
            const foreignItem = await replace(created, {
                name: 'Nome novo',
                contacts: [
                    {
                        id: crypto.randomUUID(),
                        type: 'phone',
                        value: '2133442100',
                    },
                ],
            });

            expect(invalid.status).toBe(422);
            expect(unknown.status).toBe(422);
            expect(foreignItem.status).toBe(422);
            expect(foreignItem.body.errors[0]).toMatchObject({
                field: 'contacts.0.id',
                code: 'UNKNOWN_REFERENCE',
            });
            const stored = (await get(`/v1/admin/partners/${created.id}`)).body;
            expect(stored).toEqual(created);
        });

        it('uma falha no meio da gravação desfaz todo o agregado', async () => {
            const created = (await create()).body;
            const other = (await create({ name: 'Outra clínica' })).body;

            // O slug já pertence a outro parceiro: a violação ocorre depois de a linha principal
            // ser atualizada e deve reverter inclusive as coleções.
            const conflict = await replace(created, {
                slug: other.slug,
                name: 'Alterado',
                contacts: [],
            });

            expect(conflict.status).toBe(409);
            expect(conflict.body.errors[0]).toMatchObject({
                field: 'slug',
                code: 'DUPLICATE_SLUG',
            });
            const stored = (await get(`/v1/admin/partners/${created.id}`)).body;
            expect(stored).toEqual(created);
        });

        it('trata contatos e unidades como itens protegidos pela versão do agregado', async () => {
            const created = (await create()).body;
            await replace(created, { featured: true });

            const stale = await replace(created, { name: 'Obsoleto' });
            const missing = await send(
                'put',
                `/v1/admin/partners/${created.id}`,
                completeBody({ slug: created.slug, featured: false }),
            );

            expect(stale.status).toBe(409);
            expect(stale.body.code).toBe('RESOURCE_VERSION_CONFLICT');
            expect(missing.status).toBe(428);
            expect(missing.body.code).toBe('RESOURCE_VERSION_REQUIRED');
        });

        it('preserva o endereço anterior e impede que outro parceiro o ocupe (RN-039)', async () => {
            const created = (await create()).body;
            const renamed = await replace(created, { slug: 'vida-plena' });
            expect(renamed.status).toBe(200);
            expect(renamed.body.slug).toBe('vida-plena');

            const taken = await create({ name: 'Outra', slug: 'clinica-vida' });
            const back = await replace(renamed.body, { slug: 'clinica-vida' });

            expect(taken.status).toBe(409);
            expect(taken.body.errors[0].code).toBe('DUPLICATE_SLUG');
            expect(back.status).toBe(200);
            expect(back.body.slug).toBe('clinica-vida');
        });

        it('preserva associações de itens desativados e mantém o estado do parceiro', async () => {
            const created = (await create()).body;
            await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
            );
            await send(
                'post',
                `/v1/admin/categories/${categoryId}/deactivate`,
                undefined,
                1,
            );
            await send(
                'post',
                `/v1/admin/plans/${planId}/deactivate`,
                undefined,
                1,
            );

            const stored = (await get(`/v1/admin/partners/${created.id}`)).body;

            expect(stored.status).toBe('published');
            expect(stored.categories).toEqual([
                { id: categoryId, name: 'Saúde', status: 'inactive' },
            ]);
            expect(stored.benefits).toHaveLength(1);
        });
    });

    describe('publicação, desativação e republicação', () => {
        it('informa todas as pendências e mantém o rascunho', async () => {
            const draft = (
                await send('post', '/v1/admin/partners', {
                    name: 'Incompleto',
                    categoryIds: [],
                    contacts: [],
                    units: [],
                    benefits: [],
                })
            ).body;

            const response = await send(
                'post',
                `/v1/admin/partners/${draft.id}/publish`,
                undefined,
                draft.version,
            );

            expect(response.status).toBe(422);
            expect(response.body.code).toBe('PUBLICATION_REQUIREMENTS_NOT_MET');
            expect(
                response.body.errors.map((e: Json) => e.code).sort(),
            ).toEqual(
                [
                    'PUBLICATION_BENEFIT_REQUIRED',
                    'PUBLICATION_CATEGORY_REQUIRED',
                    'PUBLICATION_CONTACT_REQUIRED',
                    'PUBLICATION_DESCRIPTION_REQUIRED',
                    'PUBLICATION_INSTRUCTIONS_REQUIRED',
                ].sort(),
            );
            expect(
                (await get(`/v1/admin/partners/${draft.id}`)).body.status,
            ).toBe('draft');
        });

        it('exige benefício para plano ativo e categoria ativa', async () => {
            const created = (await create()).body;
            await send(
                'post',
                `/v1/admin/plans/${planId}/deactivate`,
                undefined,
                1,
            );

            const response = await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
            );

            expect(response.status).toBe(422);
            expect(response.body.errors).toHaveLength(1);
            expect(response.body.errors[0].code).toBe(
                'PUBLICATION_BENEFIT_REQUIRED',
            );
        });

        it('publica um parceiro completo, sem unidade nem cupom, de forma idempotente', async () => {
            const created = (
                await create({
                    units: [],
                    generalCoupon: undefined,
                    benefits: [{ planId, discountPercentage: 5 }],
                })
            ).body;

            const published = await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
            );
            const again = await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                2,
            );

            expect(published.status).toBe(200);
            expect(published.body).toMatchObject({
                status: 'published',
                version: 2,
            });
            expect(again.status).toBe(200);
            expect(again.body.version).toBe(2);
        });

        it('um parceiro publicado só aceita edições que continuem publicáveis (RN-002)', async () => {
            const created = (await create()).body;
            const published = (
                await send(
                    'post',
                    `/v1/admin/partners/${created.id}/publish`,
                    undefined,
                    1,
                )
            ).body;

            const broken = await replace(published, { description: undefined });
            const valid = await replace(published, {
                description: 'Nova descrição.',
            });

            expect(broken.status).toBe(422);
            expect(broken.body.code).toBe('PUBLICATION_REQUIREMENTS_NOT_MET');
            expect(valid.status).toBe(200);
            expect(valid.body).toMatchObject({
                status: 'published',
                description: 'Nova descrição.',
            });
        });

        it('desativa, volta a rascunho e republica preservando as associações', async () => {
            const created = (await create()).body;
            await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
            );

            const inactive = await send(
                'post',
                `/v1/admin/partners/${created.id}/deactivate`,
                undefined,
                2,
            );
            const draft = await send(
                'post',
                `/v1/admin/partners/${created.id}/move-to-draft`,
                undefined,
                3,
            );
            const republished = await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                4,
            );

            expect(inactive.body.status).toBe('inactive');
            expect(draft.body.status).toBe('draft');
            expect(republished.body.status).toBe('published');
            expect(republished.body.units).toHaveLength(1);
            expect(republished.body.benefits).toHaveLength(1);
            expect(republished.body.version).toBe(5);
        });

        it('republica diretamente um parceiro desativado', async () => {
            const created = (await create()).body;
            await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
            );
            await send(
                'post',
                `/v1/admin/partners/${created.id}/deactivate`,
                undefined,
                2,
            );

            const response = await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                3,
            );

            expect(response.body.status).toBe('published');
        });

        it('recusa transições incompatíveis com o estado atual', async () => {
            const created = (await create()).body;
            const deactivateDraft = await send(
                'post',
                `/v1/admin/partners/${created.id}/deactivate`,
                undefined,
                1,
            );
            await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
            );
            const draftPublished = await send(
                'post',
                `/v1/admin/partners/${created.id}/move-to-draft`,
                undefined,
                2,
            );

            expect(deactivateDraft.status).toBe(409);
            expect(deactivateDraft.body.code).toBe('INVALID_RESOURCE_STATE');
            expect(draftPublished.status).toBe(409);
            expect(draftPublished.body.code).toBe('INVALID_RESOURCE_STATE');
        });

        it('exige a versão conhecida nos comandos de estado', async () => {
            const created = (await create()).body;
            await replace(created, { featured: true });

            const stale = await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
            );
            const missing = await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
            );

            expect(stale.status).toBe(409);
            expect(missing.status).toBe(428);
        });
    });

    describe('exclusão', () => {
        it('exclui um rascunho nunca publicado e devolve a última representação', async () => {
            const created = (await create()).body;

            const removed = await send(
                'delete',
                `/v1/admin/partners/${created.id}`,
                undefined,
                1,
            );

            expect(removed.status).toBe(200);
            expect(removed.body).toMatchObject({
                id: created.id,
                deleted: true,
            });
            expect((await get(`/v1/admin/partners/${created.id}`)).status).toBe(
                404,
            );
            const { rows } = await context.pool.query(
                'SELECT (SELECT count(*) FROM partner_units) AS units, (SELECT count(*) FROM partner_contacts) AS contacts, (SELECT count(*) FROM partner_benefits) AS benefits',
            );
            expect(rows[0]).toEqual({
                units: '0',
                contacts: '0',
                benefits: '0',
            });
        });

        it('preserva registros já publicados: devem ser desativados', async () => {
            const created = (await create()).body;
            await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
            );
            const published = await send(
                'delete',
                `/v1/admin/partners/${created.id}`,
                undefined,
                2,
            );
            await send(
                'post',
                `/v1/admin/partners/${created.id}/deactivate`,
                undefined,
                2,
            );
            await send(
                'post',
                `/v1/admin/partners/${created.id}/move-to-draft`,
                undefined,
                3,
            );
            const backToDraft = await send(
                'delete',
                `/v1/admin/partners/${created.id}`,
                undefined,
                4,
            );

            expect(published.status).toBe(409);
            expect(published.body.code).toBe('PROTECTED_RESOURCE');
            expect(backToDraft.status).toBe(409);
            expect(backToDraft.body.code).toBe('PROTECTED_RESOURCE');
            expect((await get(`/v1/admin/partners/${created.id}`)).status).toBe(
                200,
            );
        });

        it('exige a versão atual', async () => {
            const created = (await create()).body;
            await replace(created, { featured: true });

            const stale = await send(
                'delete',
                `/v1/admin/partners/${created.id}`,
                undefined,
                1,
            );

            expect(stale.status).toBe(409);
            expect(stale.body.code).toBe('RESOURCE_VERSION_CONFLICT');
        });
    });

    describe('consulta e autorização', () => {
        it('lista todos os estados em ordem alfabética com o agregado completo', async () => {
            await create({ name: 'Zeta' });
            const alpha = (await create({ name: 'Alfa' })).body;
            await send(
                'post',
                `/v1/admin/partners/${alpha.id}/publish`,
                undefined,
                1,
            );

            const list = await get('/v1/admin/partners');

            expect(list.status).toBe(200);
            expect(list.body.map((p: Json) => [p.name, p.status])).toEqual([
                ['Alfa', 'published'],
                ['Zeta', 'draft'],
            ]);
            expect(list.body[0].units).toHaveLength(1);
        });

        it('separa as permissões de visualizar, criar, editar, publicar e excluir (RF-016)', async () => {
            const created = (await create()).body;
            const editor = await signIn(context, {
                username: 'editora',
                fullName: 'Editora',
                permissions: ['partners.view', 'partners.update'],
            });

            const view = await get('/v1/admin/partners', editor);
            const publish = await send(
                'post',
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
                editor,
            );
            const remove = await send(
                'delete',
                `/v1/admin/partners/${created.id}`,
                undefined,
                1,
                editor,
            );
            const make = await send(
                'post',
                '/v1/admin/partners',
                completeBody(),
                undefined,
                editor,
            );
            const edit = await send(
                'put',
                `/v1/admin/partners/${created.id}`,
                completeBody({ slug: created.slug, featured: true }),
                1,
                editor,
            );

            expect(view.status).toBe(200);
            expect(publish.status).toBe(403);
            expect(remove.status).toBe(403);
            expect(make.status).toBe(403);
            expect(edit.status).toBe(200);
        });

        it('a revogação de uma permissão vale na requisição seguinte', async () => {
            const editor = await signIn(context, {
                username: 'editora',
                fullName: 'Editora',
                permissions: ['partners.view'],
            });
            expect((await get('/v1/admin/partners', editor)).status).toBe(200);

            await context.pool.query(
                "DELETE FROM user_permissions WHERE permission = 'partners.view'",
            );

            expect((await get('/v1/admin/partners', editor)).status).toBe(403);
        });
    });
});
