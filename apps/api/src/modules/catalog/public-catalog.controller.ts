import type { Request, RequestHandler } from 'express';
import { HttpError } from '../../errors/app-error';
import { DrizzlePlanRepository } from './repositories/drizzle-plan.repository';
import { DrizzleCategoryRepository } from './repositories/drizzle-category.repository';
import { DrizzlePartnerRepository } from './repositories/drizzle-partner.repository';
import { toPublicPartner } from './controllers/public-partner-representation';
import { GetPublicPartnerUseCase } from './use-cases/get-public-partner.use-case';
import { ListPublicCategoriesUseCase } from './use-cases/list-public-categories.use-case';
import { ListPublicPartnersUseCase } from './use-cases/list-public-partners.use-case';
import { ListPublicPlansUseCase } from './use-cases/list-public-plans.use-case';

const plansRepository = new DrizzlePlanRepository();
const categoriesRepository = new DrizzleCategoryRepository();
const partnersRepository = new DrizzlePartnerRepository();
const listPlans = new ListPublicPlansUseCase(plansRepository);
const listPartners = new ListPublicPartnersUseCase(
    plansRepository,
    categoriesRepository,
    partnersRepository,
);
const listCategories = new ListPublicCategoriesUseCase(
    categoriesRepository,
    listPartners,
);
const getPartner = new GetPublicPartnerUseCase(
    plansRepository,
    partnersRepository,
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const listPublicPlansController: RequestHandler = async (_req, res) => {
    res.json(
        (await listPlans.execute()).map(({ id, name, slug }) => ({
            id,
            name,
            slug,
        })),
    );
};

export const listPublicCategoriesController: RequestHandler = async (
    req,
    res,
) => {
    const planId = readId(req, 'planId');
    const result = await listCategories.execute(planId);
    if (result) res.json(result.map(({ id, name }) => ({ id, name })));
    else throw new HttpError('RESOURCE_NOT_FOUND');
};

export const listPublicPartnersController: RequestHandler = async (
    req,
    res,
) => {
    const planId = readId(req, 'planId');
    const categoryId = readOptionalId(req, 'categoryId');
    const result = await listPartners.execute(planId, categoryId);
    if (result)
        res.json(result.map((partner) => toPublicPartner(partner, planId)));
    else throw new HttpError('RESOURCE_NOT_FOUND');
};

export const getPublicPartnerController: RequestHandler = async (req, res) => {
    const slug = req.params.slug;
    if (typeof slug !== 'string' || !slug)
        throw new HttpError('RESOURCE_NOT_FOUND');
    const planId = readOptionalId(req, 'planId');
    const result = await getPartner.execute(slug, planId);
    if (result.redirectSlug) {
        const query = planId ? `?planId=${encodeURIComponent(planId)}` : '';
        res.redirect(308, `/v1/public/partners/${result.redirectSlug}${query}`);
    } else if (result.partner)
        res.json(toPublicPartner(result.partner, planId));
    else throw new HttpError('RESOURCE_NOT_FOUND');
};

function readId(req: Request, key: string): string {
    const value = req.query[key];
    if (typeof value !== 'string' || !UUID.test(value)) {
        throw new HttpError('VALIDATION_ERROR');
    }
    return value;
}

function readOptionalId(req: Request, key: string): string | undefined {
    const value = req.query[key];
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !UUID.test(value)) {
        throw new HttpError('VALIDATION_ERROR');
    }
    return value;
}
