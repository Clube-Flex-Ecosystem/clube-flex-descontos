import type {
    CategoryRecord,
    CategoryRepository,
} from '../repositories/category.repository';
import type { Clock } from '../../identity/services.types';

export class CreateCategoryUseCase {
    constructor(
        private readonly categories: CategoryRepository,
        private readonly clock: Clock,
    ) {}

    execute(input: { name: string }): Promise<CategoryRecord> {
        return this.categories.create({ name: input.name }, this.clock.now());
    }
}
