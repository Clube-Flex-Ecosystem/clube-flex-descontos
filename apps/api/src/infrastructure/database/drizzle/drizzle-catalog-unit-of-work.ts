import type {
    CatalogRepositories,
    CatalogUnitOfWork,
} from '../../../modules/catalog/repositories/catalog-unit-of-work.types';
import { db, type DatabaseExecutor } from './client';
import { DrizzleCategoryRepository } from '../../../modules/catalog/repositories/drizzle-category.repository';
import { DrizzlePartnerRepository } from '../../../modules/catalog/repositories/drizzle-partner.repository';
import { DrizzlePlanRepository } from '../../../modules/catalog/repositories/drizzle-plan.repository';

export function createCatalogRepositories(
    transaction?: DatabaseExecutor,
): CatalogRepositories {
    return {
        plans: transaction
            ? new DrizzlePlanRepository().withTransaction(transaction)
            : new DrizzlePlanRepository(),
        categories: transaction
            ? new DrizzleCategoryRepository().withTransaction(transaction)
            : new DrizzleCategoryRepository(),
        partners: transaction
            ? new DrizzlePartnerRepository().withTransaction(transaction)
            : new DrizzlePartnerRepository(),
    };
}

export class DrizzleCatalogUnitOfWork implements CatalogUnitOfWork {
    run<T>(
        work: (repositories: CatalogRepositories) => Promise<T>,
    ): Promise<T> {
        return db.transaction((tx) => work(createCatalogRepositories(tx)));
    }
}
