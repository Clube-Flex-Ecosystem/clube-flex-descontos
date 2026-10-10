import type { CategoryRepository } from './category.repository.types';
import type { PartnerRepository } from './partner.repository.types';
import type { PlanRepository } from './plan.repository.types';

export interface CatalogRepositories {
  plans: PlanRepository;
  categories: CategoryRepository;
  partners: PartnerRepository;
}

/** Executa o trabalho em uma única transação; qualquer exceção desfaz todas as escritas. */
export interface CatalogUnitOfWork {
  run<T>(work: (repositories: CatalogRepositories) => Promise<T>): Promise<T>;
}
