import type { ActiveStatus } from '@flex/contracts';
import { failVersionedUpdate } from '../domain/optimistic-concurrency';
import { ResourceNotFoundError } from '../errors';
import type {
  CategoryRecord,
  CategoryRepository,
} from '../repositories/category.repository.types';
import type { Clock } from '../../identity/services.types';

export class SetCategoryStatusUseCase {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly clock: Clock,
  ) {}

  /** Idempotente: o estado já solicitado devolve a representação atual sem nova versão. */
  async execute(input: {
    id: string;
    version: number;
    status: ActiveStatus;
  }): Promise<CategoryRecord> {
    const current = await this.categories.findById(input.id);
    if (!current) throw new ResourceNotFoundError();
    if (current.status === input.status) return current;

    const updated = await this.categories.update(
      input.id,
      input.version,
      { status: input.status },
      this.clock.now(),
    );
    return (
      updated ??
      failVersionedUpdate(async () =>
        Boolean(await this.categories.findById(input.id)),
      )
    );
  }
}
