import { isVisibleForPlan } from '@flex/contracts';
import type { CategoryRepository } from '../repositories/category.repository';
import type {
    PartnerRecord,
    PartnerRepository,
} from '../repositories/partner.repository';
import type { PlanRepository } from '../repositories/plan.repository';

export class ListPublicPartnersUseCase {
    constructor(
        private readonly plans: PlanRepository,
        private readonly categories: CategoryRepository,
        private readonly partners: PartnerRepository,
    ) {}

    async execute(
        planId: string,
        categoryId?: string,
    ): Promise<PartnerRecord[] | null> {
        const plan = await this.plans.findById(planId);
        if (!plan || plan.status !== 'active') return null;
        if (categoryId) {
            const category = await this.categories.findById(categoryId);
            if (!category || category.status !== 'active') return null;
        }
        const records = (await this.partners.list())
            .filter((p) => isVisibleForPlan(p, plan))
            .filter(
                (p) =>
                    !categoryId ||
                    p.categories.some(
                        (c) => c.id === categoryId && c.status === 'active',
                    ),
            )
            .sort(
                (a, b) =>
                    Number(b.featured) - Number(a.featured) ||
                    a.name.localeCompare(b.name, 'pt-BR'),
            );
        return records;
    }
}
