import type { Request, RequestHandler, Response } from 'express';
import {
    categoryRequestSchema,
    createPartnerRequestSchema,
    createPlanRequestSchema,
    updatePartnerRequestSchema,
    updatePlanRequestSchema,
    type ActiveStatus,
    type Partner,
    type PartnerWarning,
} from '@flex/contracts';
import { HttpError } from '../../../errors/app-error';
import { readExpectedVersion, sendVersioned } from '../../../http/versioning';
import { clock } from '../../../infrastructure/clock';
import { DrizzleCatalogUnitOfWork } from '../../../infrastructure/database/drizzle/drizzle-catalog-unit-of-work';
import { DrizzlePlanRepository } from '../repositories/drizzle-plan.repository';
import { DrizzleCategoryRepository } from '../repositories/drizzle-category.repository';
import { DrizzlePartnerRepository } from '../repositories/drizzle-partner.repository';
import type {
    PartnerRecord,
    StoredContact,
} from '../repositories/partner.repository';
import { CreateCategoryUseCase } from '../use-cases/create-category.use-case';
import { CreatePartnerUseCase } from '../use-cases/create-partner.use-case';
import { CreatePlanUseCase } from '../use-cases/create-plan.use-case';
import { DeactivatePartnerUseCase } from '../use-cases/deactivate-partner.use-case';
import { DeletePartnerUseCase } from '../use-cases/delete-partner.use-case';
import { GetCategoryUseCase } from '../use-cases/get-category.use-case';
import { GetPartnerUseCase } from '../use-cases/get-partner.use-case';
import { GetPlanUseCase } from '../use-cases/get-plan.use-case';
import { ListCategoriesUseCase } from '../use-cases/list-categories.use-case';
import { ListPartnersUseCase } from '../use-cases/list-partners.use-case';
import { ListPlansUseCase } from '../use-cases/list-plans.use-case';
import { MovePartnerToDraftUseCase } from '../use-cases/move-partner-to-draft.use-case';
import { PublishPartnerUseCase } from '../use-cases/publish-partner.use-case';
import { SetCategoryStatusUseCase } from '../use-cases/set-category-status.use-case';
import { SetPlanStatusUseCase } from '../use-cases/set-plan-status.use-case';
import { UpdateCategoryUseCase } from '../use-cases/update-category.use-case';
import { UpdatePartnerUseCase } from '../use-cases/update-partner.use-case';
import { UpdatePlanUseCase } from '../use-cases/update-plan.use-case';

const plansRepository = new DrizzlePlanRepository();
const categoriesRepository = new DrizzleCategoryRepository();
const partnersRepository = new DrizzlePartnerRepository();
const unitOfWork = new DrizzleCatalogUnitOfWork();

const useCases = {
    listPlans: new ListPlansUseCase(plansRepository),
    getPlan: new GetPlanUseCase(plansRepository),
    createPlan: new CreatePlanUseCase(plansRepository, clock),
    updatePlan: new UpdatePlanUseCase(plansRepository, clock),
    setPlanStatus: new SetPlanStatusUseCase(plansRepository, clock),
    listCategories: new ListCategoriesUseCase(categoriesRepository),
    getCategory: new GetCategoryUseCase(categoriesRepository),
    createCategory: new CreateCategoryUseCase(categoriesRepository, clock),
    updateCategory: new UpdateCategoryUseCase(categoriesRepository, clock),
    setCategoryStatus: new SetCategoryStatusUseCase(
        categoriesRepository,
        clock,
    ),
    listPartners: new ListPartnersUseCase(partnersRepository),
    getPartner: new GetPartnerUseCase(partnersRepository),
    createPartner: new CreatePartnerUseCase(unitOfWork, clock),
    updatePartner: new UpdatePartnerUseCase(unitOfWork, clock),
    publishPartner: new PublishPartnerUseCase(unitOfWork, clock),
    deactivatePartner: new DeactivatePartnerUseCase(partnersRepository, clock),
    movePartnerToDraft: new MovePartnerToDraftUseCase(
        partnersRepository,
        clock,
    ),
    deletePartner: new DeletePartnerUseCase(partnersRepository),
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ───────── Representações administrativas (montadas manualmente) ─────────

function contactBody(contact: StoredContact) {
    return {
        id: contact.id,
        type: contact.type,
        value: contact.value,
        ...(contact.label ? { label: contact.label } : {}),
    };
}

function partnerBody(
    partner: PartnerRecord,
    warnings: PartnerWarning[] = [],
): Partner {
    return {
        id: partner.id,
        slug: partner.slug,
        name: partner.name,
        ...(partner.description ? { description: partner.description } : {}),
        ...(partner.usageInstructions
            ? { usageInstructions: partner.usageInstructions }
            : {}),
        ...(partner.website ? { website: partner.website } : {}),
        featured: partner.featured,
        ...(partner.generalCoupon
            ? { generalCoupon: partner.generalCoupon }
            : {}),
        status: partner.status,
        categories: partner.categories.map(({ id, name, status }) => ({
            id,
            name,
            status,
        })),
        contacts: partner.contacts.map(contactBody),
        units: partner.units.map((unit) => ({
            id: unit.id,
            name: unit.name,
            address: {
                postalCode: unit.address.postalCode,
                street: unit.address.street,
                number: unit.address.number,
                ...(unit.address.complement
                    ? { complement: unit.address.complement }
                    : {}),
                neighborhood: unit.address.neighborhood,
                city: unit.address.city,
                state: unit.address.state,
            },
            ...(unit.openingHours ? { openingHours: unit.openingHours } : {}),
            ...(unit.instructions ? { instructions: unit.instructions } : {}),
            status: unit.status,
            contacts: unit.contacts.map(contactBody),
        })),
        benefits: partner.benefits.map((benefit) => ({
            planId: benefit.planId,
            discountPercentage: benefit.discountPercentage,
            ...(benefit.coupon ? { coupon: benefit.coupon } : {}),
        })),
        version: partner.version,
        deleted: false,
        ...(warnings.length > 0 ? { warnings } : {}),
    };
}

// ───────── Tradução de erros de aplicação ─────────

/** Controllers do catálogo: validam a entrada, executam o caso de uso e montam a resposta. */
// Repository e use cases são criados neste módulo, junto aos controllers.
/** Envolve o handler com a tradução de erros e a validação do `:id` da rota. */
const withId =
    (
        handler: (id: string, req: Request, res: Response) => Promise<void>,
    ): RequestHandler =>
    async (req, res) => {
        const id = req.params.id;
        if (typeof id !== 'string' || !UUID.test(id)) {
            throw new HttpError('RESOURCE_NOT_FOUND');
        }
        await handler(id, req, res);
    };

// ───── Planos ─────

const setPlanStatusController = (status: ActiveStatus) =>
    withId(async (id, req, res) => {
        const version = readExpectedVersion(req, res);
        if (version === undefined) return;
        const plan = await useCases.setPlanStatus.execute({
            id,
            version,
            status,
        });
        sendVersioned(res, {
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            status: plan.status,
            version: plan.version,
            deleted: false,
        });
    });

export const listPlansController: RequestHandler = async (_req, res) => {
    const plans = await useCases.listPlans.execute();
    res.json(
        plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            status: plan.status,
            version: plan.version,
            deleted: false,
        })),
    );
};
export const getPlanController = withId(async (id, _req, res) => {
    const plan = await useCases.getPlan.execute({ id });
    sendVersioned(res, {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        status: plan.status,
        version: plan.version,
        deleted: false,
    });
});
export const createPlanController: RequestHandler = async (req, res) => {
    const body = createPlanRequestSchema.parse(req.body);
    const plan = await useCases.createPlan.execute(body);
    sendVersioned(
        res,
        {
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            status: plan.status,
            version: plan.version,
            deleted: false,
        },
        201,
    );
};
export const updatePlanController = withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    const body = updatePlanRequestSchema.parse(req.body);
    const plan = await useCases.updatePlan.execute({
        id,
        version,
        name: body.name,
    });
    sendVersioned(res, {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        status: plan.status,
        version: plan.version,
        deleted: false,
    });
});
export const activatePlanController = setPlanStatusController('active');
export const deactivatePlanController = setPlanStatusController('inactive');

// ───── Categorias ─────

const setCategoryStatusController = (status: ActiveStatus) =>
    withId(async (id, req, res) => {
        const version = readExpectedVersion(req, res);
        if (version === undefined) return;
        const category = await useCases.setCategoryStatus.execute({
            id,
            version,
            status,
        });
        sendVersioned(res, {
            id: category.id,
            name: category.name,
            status: category.status,
            version: category.version,
            deleted: false,
        });
    });

export const listCategoriesController: RequestHandler = async (_req, res) => {
    const categories = await useCases.listCategories.execute();
    res.json(
        categories.map((category) => ({
            id: category.id,
            name: category.name,
            status: category.status,
            version: category.version,
            deleted: false,
        })),
    );
};
export const getCategoryController = withId(async (id, _req, res) => {
    const category = await useCases.getCategory.execute({ id });
    sendVersioned(res, {
        id: category.id,
        name: category.name,
        status: category.status,
        version: category.version,
        deleted: false,
    });
});
export const createCategoryController: RequestHandler = async (req, res) => {
    const body = categoryRequestSchema.parse(req.body);
    const category = await useCases.createCategory.execute(body);
    sendVersioned(
        res,
        {
            id: category.id,
            name: category.name,
            status: category.status,
            version: category.version,
            deleted: false,
        },
        201,
    );
};
export const updateCategoryController = withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    const body = categoryRequestSchema.parse(req.body);
    const category = await useCases.updateCategory.execute({
        id,
        version,
        name: body.name,
    });
    sendVersioned(res, {
        id: category.id,
        name: category.name,
        status: category.status,
        version: category.version,
        deleted: false,
    });
});
export const activateCategoryController = setCategoryStatusController('active');
export const deactivateCategoryController =
    setCategoryStatusController('inactive');

// ───── Parceiros ─────

type PartnerStateUseCase = {
    execute(input: { id: string; version: number }): Promise<PartnerRecord>;
};

const setPartnerStateController = (useCase: PartnerStateUseCase) =>
    withId(async (id, req, res) => {
        const version = readExpectedVersion(req, res);
        if (version === undefined) return;
        sendVersioned(res, partnerBody(await useCase.execute({ id, version })));
    });

export const listPartnersController: RequestHandler = async (_req, res) => {
    res.json(
        (await useCases.listPartners.execute()).map((p) => partnerBody(p)),
    );
};
export const getPartnerController = withId(async (id, _req, res) => {
    sendVersioned(res, partnerBody(await useCases.getPartner.execute({ id })));
});
export const createPartnerController: RequestHandler = async (req, res) => {
    const body = createPartnerRequestSchema.parse(req.body);
    const { partner, warnings } = await useCases.createPartner.execute(body);
    sendVersioned(res, partnerBody(partner, warnings), 201);
};
export const updatePartnerController = withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    const body = updatePartnerRequestSchema.parse(req.body);
    const { partner, warnings } = await useCases.updatePartner.execute({
        id,
        version,
        data: body,
    });
    sendVersioned(res, partnerBody(partner, warnings));
});
export const publishPartnerController = setPartnerStateController(
    useCases.publishPartner,
);
export const deactivatePartnerController = setPartnerStateController(
    useCases.deactivatePartner,
);
export const movePartnerToDraftController = setPartnerStateController(
    useCases.movePartnerToDraft,
);
export const deletePartnerController = withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    const removed = await useCases.deletePartner.execute({ id, version });
    res.json({ ...partnerBody(removed), deleted: true });
});
