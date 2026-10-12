import type { Request, RequestHandler, Response } from 'express';
import {
  categoryRequestSchema,
  createPartnerRequestSchema,
  createPlanRequestSchema,
  updatePartnerRequestSchema,
  updatePlanRequestSchema,
  type ActiveStatus,
  type Category,
  type Partner,
  type PartnerWarning,
  type Plan,
} from '@flex/contracts';
import { sendProblem } from '../../../http/problem';
import { fieldError, parseBody } from '../../../http/validation';
import { readExpectedVersion, sendVersioned } from '../../../http/versioning';
import { clock } from '../../../infrastructure/services';
import { DrizzleCatalogUnitOfWork } from '../../../infrastructure/database/drizzle/drizzle-catalog-unit-of-work';
import { DrizzlePlanRepository } from '../repositories/drizzle-plan.repository';
import { DrizzleCategoryRepository } from '../repositories/drizzle-category.repository';
import { DrizzlePartnerRepository } from '../repositories/drizzle-partner.repository';
import {
  DuplicateResourceError,
  InvalidResourceStateError,
  ProtectedResourceError,
  PublicationRequirementsError,
  ReferenceValidationError,
  ResourceNotFoundError,
  VersionConflictError,
  type FieldIssue,
} from '../errors';
import type { CategoryRecord } from '../repositories/category.repository';
import type {
  PartnerRecord,
  StoredContact,
} from '../repositories/partner.repository';
import type { PlanRecord } from '../repositories/plan.repository';
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
  setCategoryStatus: new SetCategoryStatusUseCase(categoriesRepository, clock),
  listPartners: new ListPartnersUseCase(partnersRepository),
  getPartner: new GetPartnerUseCase(partnersRepository),
  createPartner: new CreatePartnerUseCase(unitOfWork, clock),
  updatePartner: new UpdatePartnerUseCase(unitOfWork, clock),
  publishPartner: new PublishPartnerUseCase(unitOfWork, clock),
  deactivatePartner: new DeactivatePartnerUseCase(partnersRepository, clock),
  movePartnerToDraft: new MovePartnerToDraftUseCase(partnersRepository, clock),
  deletePartner: new DeletePartnerUseCase(partnersRepository),
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ───────── Representações administrativas (montadas manualmente) ─────────

function planBody(plan: PlanRecord): Plan {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    status: plan.status,
    version: plan.version,
    deleted: false,
  };
}

function categoryBody(category: CategoryRecord): Category {
  return {
    id: category.id,
    name: category.name,
    status: category.status,
    version: category.version,
    deleted: false,
  };
}

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
    ...(partner.generalCoupon ? { generalCoupon: partner.generalCoupon } : {}),
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

const issuesToErrors = (issues: FieldIssue[]) =>
  issues.map((issue) => fieldError(issue.field, issue.code));

/** Converte um erro conhecido do catálogo em resposta. Retorna `false` se não for conhecido. */
function respondToCatalogError(
  error: unknown,
  req: Request,
  res: Response,
): boolean {
  if (error instanceof ResourceNotFoundError) {
    sendProblem(req, res, 'RESOURCE_NOT_FOUND');
  } else if (error instanceof VersionConflictError) {
    sendProblem(req, res, 'RESOURCE_VERSION_CONFLICT');
  } else if (error instanceof DuplicateResourceError) {
    sendProblem(req, res, 'DUPLICATE_RESOURCE', {
      errors: issuesToErrors(error.issues),
    });
  } else if (error instanceof InvalidResourceStateError) {
    sendProblem(req, res, 'INVALID_RESOURCE_STATE', { detail: error.message });
  } else if (error instanceof ProtectedResourceError) {
    sendProblem(req, res, 'PROTECTED_RESOURCE', { detail: error.message });
  } else if (error instanceof PublicationRequirementsError) {
    sendProblem(req, res, 'PUBLICATION_REQUIREMENTS_NOT_MET', {
      errors: issuesToErrors(error.issues),
    });
  } else if (error instanceof ReferenceValidationError) {
    sendProblem(req, res, 'VALIDATION_ERROR', {
      errors: issuesToErrors(error.issues),
    });
  } else {
    return false;
  }
  return true;
}

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
      sendProblem(req, res, 'RESOURCE_NOT_FOUND');
      return;
    }
    try {
      await handler(id, req, res);
    } catch (error) {
      if (!respondToCatalogError(error, req, res)) throw error;
    }
  };

const withoutId =
  (handler: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (!respondToCatalogError(error, req, res)) throw error;
    }
  };

// ───── Planos ─────

const planStatus = (status: ActiveStatus) =>
  withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    sendVersioned(
      res,
      planBody(await useCases.setPlanStatus.execute({ id, version, status })),
    );
  });

const plans = {
  list: withoutId(async (_req, res) => {
    res.json((await useCases.listPlans.execute()).map(planBody));
  }),
  get: withId(async (id, _req, res) => {
    sendVersioned(res, planBody(await useCases.getPlan.execute({ id })));
  }),
  create: withoutId(async (req, res) => {
    const body = parseBody(createPlanRequestSchema, req.body);
    if (!body.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
      return;
    }
    sendVersioned(
      res,
      planBody(await useCases.createPlan.execute(body.data)),
      201,
    );
  }),
  update: withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    const body = parseBody(updatePlanRequestSchema, req.body);
    if (!body.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
      return;
    }
    sendVersioned(
      res,
      planBody(
        await useCases.updatePlan.execute({
          id,
          version,
          name: body.data.name,
        }),
      ),
    );
  }),
  activate: planStatus('active'),
  deactivate: planStatus('inactive'),
};

// ───── Categorias ─────

const categoryStatus = (status: ActiveStatus) =>
  withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    sendVersioned(
      res,
      categoryBody(
        await useCases.setCategoryStatus.execute({ id, version, status }),
      ),
    );
  });

const categories = {
  list: withoutId(async (_req, res) => {
    res.json((await useCases.listCategories.execute()).map(categoryBody));
  }),
  get: withId(async (id, _req, res) => {
    sendVersioned(
      res,
      categoryBody(await useCases.getCategory.execute({ id })),
    );
  }),
  create: withoutId(async (req, res) => {
    const body = parseBody(categoryRequestSchema, req.body);
    if (!body.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
      return;
    }
    sendVersioned(
      res,
      categoryBody(await useCases.createCategory.execute(body.data)),
      201,
    );
  }),
  update: withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    const body = parseBody(categoryRequestSchema, req.body);
    if (!body.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
      return;
    }
    sendVersioned(
      res,
      categoryBody(
        await useCases.updateCategory.execute({
          id,
          version,
          name: body.data.name,
        }),
      ),
    );
  }),
  activate: categoryStatus('active'),
  deactivate: categoryStatus('inactive'),
};

// ───── Parceiros ─────

type PartnerStateUseCase = {
  execute(input: { id: string; version: number }): Promise<PartnerRecord>;
};
const partnerState = (useCase: PartnerStateUseCase) =>
  withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    sendVersioned(res, partnerBody(await useCase.execute({ id, version })));
  });

const partners = {
  list: withoutId(async (_req, res) => {
    res.json(
      (await useCases.listPartners.execute()).map((p) => partnerBody(p)),
    );
  }),
  get: withId(async (id, _req, res) => {
    sendVersioned(res, partnerBody(await useCases.getPartner.execute({ id })));
  }),
  create: withoutId(async (req, res) => {
    const body = parseBody(createPartnerRequestSchema, req.body);
    if (!body.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
      return;
    }
    const { partner, warnings } = await useCases.createPartner.execute(
      body.data,
    );
    sendVersioned(res, partnerBody(partner, warnings), 201);
  }),
  update: withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    const body = parseBody(updatePartnerRequestSchema, req.body);
    if (!body.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
      return;
    }
    const { partner, warnings } = await useCases.updatePartner.execute({
      id,
      version,
      data: body.data,
    });
    sendVersioned(res, partnerBody(partner, warnings));
  }),
  publish: partnerState(useCases.publishPartner),
  deactivate: partnerState(useCases.deactivatePartner),
  moveToDraft: partnerState(useCases.movePartnerToDraft),
  remove: withId(async (id, req, res) => {
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    const removed = await useCases.deletePartner.execute({ id, version });
    res.json({ ...partnerBody(removed), deleted: true });
  }),
};

export const catalogControllers = { plans, categories, partners };
