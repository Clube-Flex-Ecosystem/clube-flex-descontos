import { isVisibleForPlan } from '@flex/contracts';
import type {
  PartnerRecord,
  PartnerRepository,
} from '../repositories/partner.repository';
import type { PlanRepository } from '../repositories/plan.repository';

export class GetPublicPartnerUseCase {
  constructor(
    private readonly plans: PlanRepository,
    private readonly partners: PartnerRepository,
  ) {}

  async execute(
    slug: string,
    planId?: string,
  ): Promise<{ partner?: PartnerRecord; redirectSlug?: string }> {
    const record = await this.partners.findBySlug(slug);
    if (!record) {
      return {
        redirectSlug:
          (await this.partners.findCurrentSlugByPrevious(slug)) ?? undefined,
      };
    }
    if (
      record.status !== 'published' ||
      !record.categories.some((c) => c.status === 'active')
    )
      return {};
    if (!planId) {
      const activeIds = new Set(
        (await this.plans.list())
          .filter((p) => p.status === 'active')
          .map((p) => p.id),
      );
      if (!record.benefits.some((b) => activeIds.has(b.planId))) return {};
      return { partner: record };
    }
    const plan = await this.plans.findById(planId);
    if (!plan || plan.status !== 'active' || !isVisibleForPlan(record, plan))
      return {};
    return { partner: record };
  }
}
