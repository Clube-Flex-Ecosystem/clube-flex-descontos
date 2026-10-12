import type { ActiveStatus } from '@flex/contracts';
import { ReferenceValidationError, type FieldIssue } from '../errors';
import type { CatalogRepositories } from '../repositories/catalog-unit-of-work.types';
import type {
  PartnerData,
  PartnerRecord,
} from '../repositories/partner.repository';

export interface ResolvedReferences {
  categories: { id: string; status: ActiveStatus }[];
  /** Planos ativos entre os referenciados pelos benefícios. */
  activePlanIds: Set<string>;
}

/**
 * Confere as referências do agregado: categorias e planos precisam existir e, para serem
 * associados agora, estar ativos. Uma associação já existente é preservada mesmo quando o
 * item foi desativado depois (as associações sobrevivem à inatividade). Itens internos
 * identificados (contatos e unidades) precisam pertencer ao parceiro editado.
 */
export async function resolveReferences(
  repositories: Pick<CatalogRepositories, 'plans' | 'categories'>,
  data: Pick<PartnerData, 'categoryIds' | 'benefits' | 'contacts' | 'units'>,
  existing?: PartnerRecord,
): Promise<ResolvedReferences> {
  const issues: FieldIssue[] = [];

  const knownCategoryIds = new Set(existing?.categories.map((c) => c.id));
  const categories = await repositories.categories.findByIds(data.categoryIds);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  data.categoryIds.forEach((id, index) => {
    const category = categoryById.get(id);
    if (!category) {
      issues.push({ field: `categoryIds.${index}`, code: 'UNKNOWN_REFERENCE' });
    } else if (category.status === 'inactive' && !knownCategoryIds.has(id)) {
      issues.push({
        field: `categoryIds.${index}`,
        code: 'INACTIVE_REFERENCE',
      });
    }
  });

  const knownPlanIds = new Set(existing?.benefits.map((b) => b.planId));
  const plans = await repositories.plans.findByIds(
    data.benefits.map((benefit) => benefit.planId),
  );
  const planById = new Map(plans.map((p) => [p.id, p]));
  data.benefits.forEach((benefit, index) => {
    const plan = planById.get(benefit.planId);
    if (!plan) {
      issues.push({
        field: `benefits.${index}.planId`,
        code: 'UNKNOWN_REFERENCE',
      });
    } else if (plan.status === 'inactive' && !knownPlanIds.has(plan.id)) {
      issues.push({
        field: `benefits.${index}.planId`,
        code: 'INACTIVE_REFERENCE',
      });
    }
  });

  const partnerContactIds = new Set(existing?.contacts.map((c) => c.id));
  data.contacts.forEach((contact, index) => {
    if (contact.id && !partnerContactIds.has(contact.id)) {
      issues.push({ field: `contacts.${index}.id`, code: 'UNKNOWN_REFERENCE' });
    }
  });

  const existingUnits = new Map(existing?.units.map((u) => [u.id, u]));
  data.units.forEach((unit, unitIndex) => {
    const stored = unit.id ? existingUnits.get(unit.id) : undefined;
    if (unit.id && !stored) {
      issues.push({
        field: `units.${unitIndex}.id`,
        code: 'UNKNOWN_REFERENCE',
      });
    }
    const unitContactIds = new Set(stored?.contacts.map((c) => c.id));
    unit.contacts.forEach((contact, contactIndex) => {
      if (contact.id && !unitContactIds.has(contact.id)) {
        issues.push({
          field: `units.${unitIndex}.contacts.${contactIndex}.id`,
          code: 'UNKNOWN_REFERENCE',
        });
      }
    });
  });

  if (issues.length > 0) throw new ReferenceValidationError(issues);

  return {
    categories: categories.map((c) => ({ id: c.id, status: c.status })),
    activePlanIds: new Set(
      plans.filter((plan) => plan.status === 'active').map((plan) => plan.id),
    ),
  };
}
