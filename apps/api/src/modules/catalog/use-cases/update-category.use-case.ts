import { failVersionedUpdate } from '../domain/optimistic-concurrency';
import type {
    CategoryRecord,
    CategoryRepository,
} from '../repositories/category.repository';
import type { Clock } from '../../identity/services.types';

export class UpdateCategoryUseCase {
    constructor(
        private readonly categories: CategoryRepository,
        private readonly clock: Clock,
    ) {}

    async execute(input: {
        id: string;
        version: number;
        name: string;
    }): Promise<CategoryRecord> {
        const updated = await this.categories.update(
            input.id,
            input.version,
            { name: input.name },
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
