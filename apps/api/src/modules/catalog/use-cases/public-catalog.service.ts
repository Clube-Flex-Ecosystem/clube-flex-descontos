import {
  effectiveCoupon,
  effectiveUnitContacts,
  isVisibleForPlan,
  type PublicCategory,
  type PublicPartner,
  type PublicPlan,
} from '@flex/contracts';
import type { CategoryRepository } from '../repositories/category.repository.types';
import type {
  PartnerRecord,
  PartnerRepository,
} from '../repositories/partner.repository.types';
import type { PlanRepository } from '../repositories/plan.repository.types';

export class PublicCatalogService {
  constructor(
    private readonly plans: PlanRepository,
    private readonly categories: CategoryRepository,
    private readonly partners: PartnerRepository,
  ) {}

  async listPlans(): Promise<PublicPlan[]> {
    return (await this.plans.list())
      .filter((p) => p.status === 'active')
      .map(({ id, name, slug }) => ({ id, name, slug }));
  }

  private async activePlan(planId: string) {
    const plan = await this.plans.findById(planId);
    return plan?.status === 'active' ? plan : null;
  }

  async listPartners(
    planId: string,
    categoryId?: string,
  ): Promise<PublicPartner[] | null> {
    const plan = await this.activePlan(planId);
    if (!plan) return null;
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
    return records.map((p) => this.toPublic(p, planId));
  }

  async listCategories(planId: string): Promise<PublicCategory[] | null> {
    const partners = await this.listPartners(planId);
    if (!partners) return null;
    const visible = new Set(
      partners.flatMap((p) => p.categories.map((c) => c.id)),
    );
    return (await this.categories.list())
      .filter((c) => c.status === 'active' && visible.has(c.id))
      .map(({ id, name }) => ({ id, name }));
  }

  async getPartner(
    slug: string,
    planId?: string,
  ): Promise<{ partner?: PublicPartner; redirectSlug?: string }> {
    const record = await this.partners.findBySlug(slug);
    if (!record)
      return {
        redirectSlug:
          (await this.partners.findCurrentSlugByPrevious(slug)) ?? undefined,
      };
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
      return { partner: this.toPublic(record) };
    }
    const plan = await this.activePlan(planId);
    if (!plan || !isVisibleForPlan(record, plan)) return {};
    return { partner: this.toPublic(record, planId) };
  }

  private toPublic(partner: PartnerRecord, planId?: string): PublicPartner {
    const benefit = planId
      ? partner.benefits.find((b) => b.planId === planId)
      : undefined;
    return {
      slug: partner.slug,
      name: partner.name,
      description: partner.description!,
      featured: partner.featured,
      categories: partner.categories
        .filter((c) => c.status === 'active')
        .map(({ id, name }) => ({ id, name })),
      ...(benefit ? { discountPercentage: benefit.discountPercentage } : {}),
      ...(benefit && effectiveCoupon(partner, benefit)
        ? { coupon: effectiveCoupon(partner, benefit) }
        : {}),
      usageInstructions: partner.usageInstructions!,
      ...(partner.website ? { website: partner.website } : {}),
      contacts: partner.contacts.map(({ type, value, label }) => ({
        type,
        value,
        ...(label ? { label } : {}),
      })),
      units: partner.units
        .filter((u) => u.status === 'active')
        .map((u) => ({
          name: u.name,
          address: u.address,
          ...(u.openingHours ? { openingHours: u.openingHours } : {}),
          ...(u.instructions ? { instructions: u.instructions } : {}),
          contacts: effectiveUnitContacts(u.contacts, partner.contacts).map(
            ({ type, value, label, inherited }) => ({
              type,
              value,
              ...(label ? { label } : {}),
              ...(inherited ? { inherited } : {}),
            }),
          ),
        })),
    };
  }
}
