import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
    createTestApp,
    DASHBOARD_ORIGIN,
    resetDatabase,
    signIn,
} from './support';

describe('operação comercial', () => {
    const context = createTestApp();
    beforeEach(() => resetDatabase(context.pool));
    afterAll(() => context.pool.end());
    const auth = (session: { cookie: string; csrf: string }) => ({
        cookie: session.cookie,
        origin: DASHBOARD_ORIGIN,
        'x-csrf-token': session.csrf,
    });

    it('cadastra origem e lead manual, registra histórico e protege por versão', async () => {
        const session = await signIn(context, {
            permissions: [
                'leads.view-own',
                'leads.create',
                'leads.update',
                'leads.change-stage',
                'sources.view',
                'sources.manage',
            ],
        });
        const source = await request(context.app)
            .post('/v1/admin/lead-sources')
            .set(auth(session))
            .send({ name: 'Indicação', requiresReferral: true })
            .expect(201);
        const created = await request(context.app)
            .post('/v1/admin/leads')
            .set(auth(session))
            .send({
                name: 'João Lima',
                whatsapp: '(21) 99999-1111',
                sourceId: source.body.id,
                referredBy: 'Maria',
                leaveUnassigned: false,
            })
            .expect(201);
        expect(created.body).toMatchObject({
            name: 'João Lima',
            stage: 'new',
            version: 1,
            assignee: { fullName: 'Maria Silva' },
        });
        await request(context.app)
            .post(`/v1/admin/leads/${created.body.id}/stage-transitions`)
            .set(auth(session))
            .set('if-match', '"1"')
            .send({ stage: 'negotiating' })
            .expect(200)
            .expect(({ body }) =>
                expect(body).toMatchObject({
                    stage: 'negotiating',
                    version: 2,
                }),
            );
        await request(context.app)
            .post(`/v1/admin/leads/${created.body.id}/stage-transitions`)
            .set(auth(session))
            .set('if-match', '"1"')
            .send({ stage: 'lost' })
            .expect(409)
            .expect(({ body }) =>
                expect(body.code).toBe('RESOURCE_VERSION_CONFLICT'),
            );
        const history = await request(context.app)
            .get(`/v1/admin/leads/${created.body.id}/history`)
            .set('cookie', session.cookie)
            .expect(200);
        expect(
            history.body.map((event: { type: string }) => event.type),
        ).toEqual(
            expect.arrayContaining(['lead.created', 'lead.stage-changed']),
        );
    });

    it('aplica o escopo de próprios e permite ao responsável devolver seu lead', async () => {
        const owner = await signIn(context, {
            username: 'dono',
            permissions: [
                'leads.view-own',
                'leads.create',
                'sources.view',
                'sources.manage',
            ],
        });
        const source = await request(context.app)
            .post('/v1/admin/lead-sources')
            .set(auth(owner))
            .send({ name: 'Abordagem', requiresReferral: false })
            .expect(201);
        const lead = await request(context.app)
            .post('/v1/admin/leads')
            .set(auth(owner))
            .send({
                name: 'Contato',
                whatsapp: '+5521988887777',
                sourceId: source.body.id,
                leaveUnassigned: false,
            })
            .expect(201);
        await request(context.app)
            .put(`/v1/admin/leads/${lead.body.id}/assignee`)
            .set(auth(owner))
            .set('if-match', '"1"')
            .send({ assigneeId: null })
            .expect((response) => {
                if (response.status !== 200)
                    throw new Error(JSON.stringify(response.body));
            })
            .expect(200)
            .expect(({ body }) => expect(body.assignee).toBeUndefined());
        const other = await signIn(context, {
            username: 'outro',
            permissions: ['leads.view-own'],
        });
        await request(context.app)
            .get('/v1/admin/leads')
            .set('cookie', other.cookie)
            .expect(200, []);
    });
});
