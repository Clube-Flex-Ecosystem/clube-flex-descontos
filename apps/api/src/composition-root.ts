import type { Pool } from 'pg';
import { CreateCategoryUseCase } from './modules/catalog/use-cases/create-category.use-case';
import { CreatePartnerUseCase } from './modules/catalog/use-cases/create-partner.use-case';
import { CreatePlanUseCase } from './modules/catalog/use-cases/create-plan.use-case';
import { DeactivatePartnerUseCase } from './modules/catalog/use-cases/deactivate-partner.use-case';
import { DeletePartnerUseCase } from './modules/catalog/use-cases/delete-partner.use-case';
import { GetCategoryUseCase } from './modules/catalog/use-cases/get-category.use-case';
import { GetPartnerUseCase } from './modules/catalog/use-cases/get-partner.use-case';
import { GetPlanUseCase } from './modules/catalog/use-cases/get-plan.use-case';
import { ListCategoriesUseCase } from './modules/catalog/use-cases/list-categories.use-case';
import { ListPartnersUseCase } from './modules/catalog/use-cases/list-partners.use-case';
import { ListPlansUseCase } from './modules/catalog/use-cases/list-plans.use-case';
import { MovePartnerToDraftUseCase } from './modules/catalog/use-cases/move-partner-to-draft.use-case';
import { PublishPartnerUseCase } from './modules/catalog/use-cases/publish-partner.use-case';
import { SetCategoryStatusUseCase } from './modules/catalog/use-cases/set-category-status.use-case';
import { SetPlanStatusUseCase } from './modules/catalog/use-cases/set-plan-status.use-case';
import { UpdateCategoryUseCase } from './modules/catalog/use-cases/update-category.use-case';
import { UpdatePartnerUseCase } from './modules/catalog/use-cases/update-partner.use-case';
import { UpdatePlanUseCase } from './modules/catalog/use-cases/update-plan.use-case';
import { PublicCatalogService } from './modules/catalog/use-cases/public-catalog.service';
import { AccessCodeDelivery } from './modules/identity/access-code-delivery';
import type {
  ApplicationLogger,
  Clock,
  EmailSender,
  PasswordHasher,
} from './modules/identity/services.types';
import { AuthenticateUserUseCase } from './modules/identity/use-cases/authenticate-user.use-case';
import { BootstrapFirstAdministratorUseCase } from './modules/identity/use-cases/bootstrap-first-administrator.use-case';
import { ChangePasswordUseCase } from './modules/identity/use-cases/change-password.use-case';
import { LogoutUseCase } from './modules/identity/use-cases/logout.use-case';
import { RequestRecoveryUseCase } from './modules/identity/use-cases/request-recovery.use-case';
import { ResolveSessionUseCase } from './modules/identity/use-cases/resolve-session.use-case';
import { SetPasswordWithAccessCodeUseCase } from './modules/identity/use-cases/set-password-with-access-code.use-case';
import { createDatabase } from './infrastructure/database/drizzle/client';
import {
  DrizzleCatalogUnitOfWork,
  createCatalogRepositories,
} from './infrastructure/database/drizzle/drizzle-catalog-unit-of-work';
import {
  DrizzleUnitOfWork,
  createRepositories,
} from './infrastructure/database/drizzle/drizzle-unit-of-work';

export interface CompositionDependencies {
  pool: Pool;
  hasher: PasswordHasher;
  emailSender: EmailSender;
  clock: Clock;
  logger: ApplicationLogger;
  dashboardOrigin: string;
}

/** Ponto único de composição manual das dependências (ADR-0006), sem container de DI. */
export function createCompositionRoot(deps: CompositionDependencies) {
  const db = createDatabase(deps.pool);
  const unitOfWork = new DrizzleUnitOfWork(db);
  const { users, sessions, permissions } = createRepositories(db);
  const catalogUnitOfWork = new DrizzleCatalogUnitOfWork(db);
  const { plans, categories, partners } = createCatalogRepositories(db);
  const delivery = new AccessCodeDelivery(
    deps.emailSender,
    deps.dashboardOrigin,
  );

  return {
    catalog: {
      public: new PublicCatalogService(plans, categories, partners),
      listPlans: new ListPlansUseCase(plans),
      getPlan: new GetPlanUseCase(plans),
      createPlan: new CreatePlanUseCase(plans, deps.clock),
      updatePlan: new UpdatePlanUseCase(plans, deps.clock),
      setPlanStatus: new SetPlanStatusUseCase(plans, deps.clock),
      listCategories: new ListCategoriesUseCase(categories),
      getCategory: new GetCategoryUseCase(categories),
      createCategory: new CreateCategoryUseCase(categories, deps.clock),
      updateCategory: new UpdateCategoryUseCase(categories, deps.clock),
      setCategoryStatus: new SetCategoryStatusUseCase(categories, deps.clock),
      listPartners: new ListPartnersUseCase(partners),
      getPartner: new GetPartnerUseCase(partners),
      createPartner: new CreatePartnerUseCase(catalogUnitOfWork, deps.clock),
      updatePartner: new UpdatePartnerUseCase(catalogUnitOfWork, deps.clock),
      publishPartner: new PublishPartnerUseCase(catalogUnitOfWork, deps.clock),
      deactivatePartner: new DeactivatePartnerUseCase(partners, deps.clock),
      movePartnerToDraft: new MovePartnerToDraftUseCase(partners, deps.clock),
      deletePartner: new DeletePartnerUseCase(partners),
    },
    identity: {
      resolveSession: new ResolveSessionUseCase(
        sessions,
        users,
        permissions,
        deps.clock,
      ),
      authenticateUser: new AuthenticateUserUseCase(
        users,
        sessions,
        deps.hasher,
        deps.clock,
      ),
      logout: new LogoutUseCase(sessions, deps.clock),
      setPasswordWithAccessCode: new SetPasswordWithAccessCodeUseCase(
        unitOfWork,
        deps.hasher,
        deps.clock,
      ),
      requestRecovery: new RequestRecoveryUseCase(
        unitOfWork,
        delivery,
        deps.clock,
        deps.logger,
      ),
      changePassword: new ChangePasswordUseCase(
        unitOfWork,
        deps.hasher,
        deps.clock,
      ),
      bootstrapFirstAdministrator: new BootstrapFirstAdministratorUseCase(
        unitOfWork,
        delivery,
        deps.clock,
      ),
    },
  };
}

export type CompositionRoot = ReturnType<typeof createCompositionRoot>;
