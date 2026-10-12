import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
    ALL_CATALOG_PERMISSIONS,
    createTestApp,
    resetDatabase,
    signIn,
    type SignedInSession,
} from './support';

describe('catálogo público', () => {
    const context = createTestApp();
    let session: SignedInSession;
    beforeAll(async () => {
        await context.pool.query('select 1');
    });
    beforeEach(async () => {
        await resetDatabase(context.pool);
        session = await signIn(context, {
            permissions: ALL_CATALOG_PERMISSIONS,
        });
    });
    afterAll(async () => context.pool.end());

    const post = (url: string, body?: object, version?: number) => {
        const req = request(context.app)
            .post(url)
            .set('origin', 'http://localhost:5173')
            .set('cookie', session.cookie)
            .set('x-csrf-token', session.csrf);
        if (version) req.set('if-match', `"${version}"`);
        return body ? req.send(body) : req;
    };

    it('expõe somente parceiros elegíveis, ordena destaque e aplica cupom específico', async () => {
        const plan = (
            await post('/v1/admin/plans', { name: 'Família', slug: 'familia' })
        ).body;
        const category = (await post('/v1/admin/categories', { name: 'Saúde' }))
            .body;
        const make = async (
            name: string,
            featured: boolean,
            coupon?: string,
        ) => {
            const created = (
                await post('/v1/admin/partners', {
                    name,
                    description: 'Descrição pública',
                    usageInstructions: 'Apresente seu cartão.',
                    featured,
                    categoryIds: [category.id],
                    contacts: [{ type: 'whatsapp', value: '(21) 99999-9999' }],
                    units: [],
                    generalCoupon: 'GERAL',
                    benefits: [
                        { planId: plan.id, discountPercentage: 20, coupon },
                    ],
                })
            ).body;
            await post(
                `/v1/admin/partners/${created.id}/publish`,
                undefined,
                1,
            );
            return created;
        };
        await make('Alfa', false);
        await make('Zeta', true, 'ESPECIFICO');

        const plans = await request(context.app).get('/v1/public/plans');
        const categories = await request(context.app)
            .get('/v1/public/categories')
            .query({ planId: plan.id });
        const partners = await request(context.app)
            .get('/v1/public/partners')
            .query({ planId: plan.id });

        expect(plans.body).toEqual([
            { id: plan.id, name: 'Família', slug: 'familia' },
        ]);
        expect(categories.body).toEqual([{ id: category.id, name: 'Saúde' }]);
        expect(partners.body.map((p: { name: string }) => p.name)).toEqual([
            'Zeta',
            'Alfa',
        ]);
        expect(partners.body[0]).toMatchObject({
            discountPercentage: 20,
            coupon: 'ESPECIFICO',
        });
        expect(partners.body[1].coupon).toBe('GERAL');
    });

    it('omite benefício sem plano e redireciona slug anterior permanentemente', async () => {
        const plan = (
            await post('/v1/admin/plans', { name: 'Multi', slug: 'multi' })
        ).body;
        const category = (
            await post('/v1/admin/categories', { name: 'Educação' })
        ).body;
        const created = (
            await post('/v1/admin/partners', {
                name: 'Ponte',
                slug: 'ponte',
                description: 'Idiomas',
                usageInstructions: 'Agende.',
                featured: false,
                categoryIds: [category.id],
                contacts: [{ type: 'phone', value: '(21) 2222-3333' }],
                units: [],
                benefits: [{ planId: plan.id, discountPercentage: 15 }],
            })
        ).body;
        const updated = await request(context.app)
            .put(`/v1/admin/partners/${created.id}`)
            .set('origin', 'http://localhost:5173')
            .set('cookie', session.cookie)
            .set('x-csrf-token', session.csrf)
            .set('if-match', '"1"')
            .send({
                name: 'Ponte',
                slug: 'ponte-idiomas',
                description: 'Idiomas',
                usageInstructions: 'Agende.',
                featured: false,
                categoryIds: [category.id],
                contacts: created.contacts,
                units: [],
                benefits: [{ planId: plan.id, discountPercentage: 15 }],
            });
        await post(
            `/v1/admin/partners/${created.id}/publish`,
            undefined,
            updated.body.version,
        );

        const detail = await request(context.app).get(
            '/v1/public/partners/ponte-idiomas',
        );
        const old = await request(context.app)
            .get('/v1/public/partners/ponte')
            .redirects(0);
        expect(detail.body.discountPercentage).toBeUndefined();
        expect(old.status).toBe(308);
        expect(old.headers.location).toBe('/v1/public/partners/ponte-idiomas');
    });
});
