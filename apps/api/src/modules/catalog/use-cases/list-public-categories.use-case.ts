import type {
    CategoryRecord,
    CategoryRepository,
} from '../repositories/category.repository';
import type { ListPublicPartnersUseCase } from './list-public-partners.use-case';

export class ListPublicCategoriesUseCase {
    constructor(
        private readonly categories: CategoryRepository,
        private readonly partners: ListPublicPartnersUseCase,
    ) {}

    async execute(planId: string): Promise<CategoryRecord[] | null> {
        const partners = await this.partners.execute(planId);
        if (!partners) return null;
        const visible = new Set(
            partners.flatMap((p) => p.categories.map((c) => c.id)),
        );
        return (await this.categories.list()).filter(
            (c) => c.status === 'active' && visible.has(c.id),
        );
    }
}
