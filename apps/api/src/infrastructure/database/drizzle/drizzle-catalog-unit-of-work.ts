import type {
  CatalogRepositories,
  CatalogUnitOfWork,
} from '../../../modules/catalog/repositories/catalog-unit-of-work.types';
import type { Database, DatabaseExecutor } from './client';
import { DrizzleCategoryRepository } from './repositories/drizzle-category.repository';
import { DrizzlePartnerRepository } from './repositories/drizzle-partner.repository';
import { DrizzlePlanRepository } from './repositories/drizzle-plan.repository';

export function createCatalogRepositories(
  executor: DatabaseExecutor,
): CatalogRepositories {
  return {
    plans: new DrizzlePlanRepository(executor),
    categories: new DrizzleCategoryRepository(executor),
    partners: new DrizzlePartnerRepository(executor),
  };
}

export class DrizzleCatalogUnitOfWork implements CatalogUnitOfWork {
  constructor(private readonly db: Database) {}

  run<T>(work: (repositories: CatalogRepositories) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => work(createCatalogRepositories(tx)));
  }
}
