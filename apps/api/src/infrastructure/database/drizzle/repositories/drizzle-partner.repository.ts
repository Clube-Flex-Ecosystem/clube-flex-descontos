import { normalizeNameKey, type PartnerStatus } from '@flex/contracts';
import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  ne,
  notInArray,
  sql,
} from 'drizzle-orm';
import { DuplicateResourceError } from '../../../../modules/catalog/errors';
import type {
  ContactData,
  PartnerData,
  PartnerRecord,
  PartnerRepository,
  StoredContact,
} from '../../../../modules/catalog/repositories/partner.repository.types';
import type { DatabaseExecutor } from '../client';
import {
  categories,
  partnerBenefits,
  partnerCategories,
  partnerContacts,
  partnerSlugHistory,
  partnerUnits,
  partners,
} from '../schema';
import { uniqueViolationConstraint } from '../unique-violation';

type PartnerRow = typeof partners.$inferSelect;
type ContactRow = typeof partnerContacts.$inferSelect;

function toStoredContact(row: ContactRow): StoredContact {
  return {
    id: row.id,
    type: row.type,
    value: row.value,
    ...(row.label ? { label: row.label } : {}),
  };
}

const duplicateSlug = () =>
  new DuplicateResourceError([{ field: 'slug', code: 'DUPLICATE_SLUG' }]);

export class DrizzlePartnerRepository implements PartnerRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async list(): Promise<PartnerRecord[]> {
    const rows = await this.db
      .select()
      .from(partners)
      .orderBy(asc(partners.nameKey), asc(partners.createdAt));
    return this.hydrate(rows);
  }

  async findById(id: string): Promise<PartnerRecord | null> {
    const rows = await this.db
      .select()
      .from(partners)
      .where(eq(partners.id, id));
    return (await this.hydrate(rows))[0] ?? null;
  }

  async hasSimilarName(name: string, excludingId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: partners.id })
      .from(partners)
      .where(
        and(
          eq(partners.nameKey, normalizeNameKey(name)),
          ne(partners.id, excludingId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async slugExists(slug: string): Promise<boolean> {
    const [current] = await this.db
      .select({ id: partners.id })
      .from(partners)
      .where(eq(partners.slug, slug));
    if (current) return true;
    const [previous] = await this.db
      .select({ slug: partnerSlugHistory.slug })
      .from(partnerSlugHistory)
      .where(eq(partnerSlugHistory.slug, slug));
    return Boolean(previous);
  }

  async create(data: PartnerData, now: Date): Promise<PartnerRecord> {
    if (await this.slugExists(data.slug)) throw duplicateSlug();
    try {
      const [row] = await this.db
        .insert(partners)
        .values({
          ...this.scalarColumns(data),
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: partners.id });
      if (!row) throw new Error('Falha ao criar o parceiro');
      await this.writeChildren(row.id, data);
      const created = await this.findById(row.id);
      if (!created) throw new Error('Parceiro criado não encontrado');
      return created;
    } catch (error) {
      throw this.translate(error);
    }
  }

  async replace(
    id: string,
    expectedVersion: number,
    data: PartnerData,
    now: Date,
  ): Promise<PartnerRecord | null> {
    try {
      const [current] = await this.db
        .select({ slug: partners.slug })
        .from(partners)
        .where(eq(partners.id, id));
      if (!current) return null;

      const slugChanged = current.slug !== data.slug;
      if (slugChanged) {
        // Um endereço aposentado só pode voltar ao parceiro que o possuía.
        const [retired] = await this.db
          .select({ partnerId: partnerSlugHistory.partnerId })
          .from(partnerSlugHistory)
          .where(eq(partnerSlugHistory.slug, data.slug));
        if (retired && retired.partnerId !== id) throw duplicateSlug();
      }

      const [updated] = await this.db
        .update(partners)
        .set({
          ...this.scalarColumns(data),
          version: sql`${partners.version} + 1`,
          updatedAt: now,
        })
        .where(and(eq(partners.id, id), eq(partners.version, expectedVersion)))
        .returning({ id: partners.id });
      if (!updated) return null;

      if (slugChanged) {
        // A URL anterior é preservada para o redirecionamento permanente (RN-039).
        await this.db
          .insert(partnerSlugHistory)
          .values({ slug: current.slug, partnerId: id, retiredAt: now })
          .onConflictDoNothing();
        await this.db
          .delete(partnerSlugHistory)
          .where(eq(partnerSlugHistory.slug, data.slug));
      }

      await this.writeChildren(id, data);
      return await this.findById(id);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async setStatus(
    id: string,
    expectedVersion: number,
    status: PartnerStatus,
    now: Date,
  ): Promise<PartnerRecord | null> {
    const [row] = await this.db
      .update(partners)
      .set({
        status,
        ...(status === 'published'
          ? {
              firstPublishedAt: sql`coalesce(${partners.firstPublishedAt}, ${now.toISOString()}::timestamptz)`,
            }
          : {}),
        version: sql`${partners.version} + 1`,
        updatedAt: now,
      })
      .where(and(eq(partners.id, id), eq(partners.version, expectedVersion)))
      .returning({ id: partners.id });
    return row ? this.findById(row.id) : null;
  }

  async delete(id: string, expectedVersion: number): Promise<boolean> {
    const rows = await this.db
      .delete(partners)
      .where(and(eq(partners.id, id), eq(partners.version, expectedVersion)))
      .returning({ id: partners.id });
    return rows.length > 0;
  }

  private scalarColumns(data: PartnerData) {
    return {
      name: data.name,
      nameKey: normalizeNameKey(data.name),
      slug: data.slug,
      description: data.description ?? null,
      usageInstructions: data.usageInstructions ?? null,
      website: data.website ?? null,
      featured: data.featured,
      generalCoupon: data.generalCoupon ?? null,
    };
  }

  /** Substitui as coleções do agregado, preservando os identificadores já persistidos. */
  private async writeChildren(
    partnerId: string,
    data: PartnerData,
  ): Promise<void> {
    await this.db
      .delete(partnerCategories)
      .where(eq(partnerCategories.partnerId, partnerId));
    const categoryIds = [...new Set(data.categoryIds)];
    if (categoryIds.length > 0) {
      await this.db
        .insert(partnerCategories)
        .values(categoryIds.map((categoryId) => ({ partnerId, categoryId })));
    }

    await this.db
      .delete(partnerBenefits)
      .where(eq(partnerBenefits.partnerId, partnerId));
    if (data.benefits.length > 0) {
      await this.db.insert(partnerBenefits).values(
        data.benefits.map((benefit) => ({
          partnerId,
          planId: benefit.planId,
          discountPercentage: benefit.discountPercentage,
          coupon: benefit.coupon ?? null,
        })),
      );
    }

    await this.writeContacts(partnerId, null, data.contacts);

    const keptUnitIds = data.units.flatMap((unit) =>
      unit.id ? [unit.id] : [],
    );
    await this.db
      .delete(partnerUnits)
      .where(
        and(
          eq(partnerUnits.partnerId, partnerId),
          keptUnitIds.length > 0
            ? notInArray(partnerUnits.id, keptUnitIds)
            : undefined,
        ),
      );

    for (const [position, unit] of data.units.entries()) {
      const columns = {
        position,
        name: unit.name,
        postalCode: unit.address.postalCode,
        street: unit.address.street,
        number: unit.address.number,
        complement: unit.address.complement ?? null,
        neighborhood: unit.address.neighborhood,
        city: unit.address.city,
        state: unit.address.state,
        openingHours: unit.openingHours ?? null,
        instructions: unit.instructions ?? null,
        status: unit.status,
      };
      let unitId = unit.id;
      if (unitId) {
        await this.db
          .update(partnerUnits)
          .set(columns)
          .where(
            and(
              eq(partnerUnits.id, unitId),
              eq(partnerUnits.partnerId, partnerId),
            ),
          );
      } else {
        const [created] = await this.db
          .insert(partnerUnits)
          .values({ partnerId, ...columns })
          .returning({ id: partnerUnits.id });
        if (!created) throw new Error('Falha ao criar a unidade');
        unitId = created.id;
      }
      await this.writeContacts(partnerId, unitId, unit.contacts);
    }
  }

  private async writeContacts(
    partnerId: string,
    unitId: string | null,
    contacts: ContactData[],
  ): Promise<void> {
    const owner = and(
      eq(partnerContacts.partnerId, partnerId),
      unitId === null
        ? isNull(partnerContacts.unitId)
        : eq(partnerContacts.unitId, unitId),
    );
    const keptIds = contacts.flatMap((contact) =>
      contact.id ? [contact.id] : [],
    );
    await this.db
      .delete(partnerContacts)
      .where(
        and(
          owner,
          keptIds.length > 0
            ? notInArray(partnerContacts.id, keptIds)
            : undefined,
        ),
      );

    for (const [position, contact] of contacts.entries()) {
      const columns = {
        position,
        type: contact.type,
        value: contact.value,
        label: contact.label ?? null,
      };
      if (contact.id) {
        await this.db
          .update(partnerContacts)
          .set(columns)
          .where(and(owner, eq(partnerContacts.id, contact.id)));
      } else {
        await this.db
          .insert(partnerContacts)
          .values({ partnerId, unitId, ...columns });
      }
    }
  }

  private translate(error: unknown): unknown {
    const constraint = uniqueViolationConstraint(error);
    return constraint === 'partners_slug_unique' ||
      constraint === 'partner_slug_history_pkey'
      ? duplicateSlug()
      : error;
  }

  private async hydrate(rows: PartnerRow[]): Promise<PartnerRecord[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);

    // Consultas em sequência: o executor pode ser uma única conexão transacional.
    const categoryRows = await this.db
      .select({
        partnerId: partnerCategories.partnerId,
        id: categories.id,
        name: categories.name,
        status: categories.status,
      })
      .from(partnerCategories)
      .innerJoin(categories, eq(partnerCategories.categoryId, categories.id))
      .where(inArray(partnerCategories.partnerId, ids))
      .orderBy(asc(categories.nameKey));
    const unitRows = await this.db
      .select()
      .from(partnerUnits)
      .where(inArray(partnerUnits.partnerId, ids))
      .orderBy(asc(partnerUnits.position));
    const contactRows = await this.db
      .select()
      .from(partnerContacts)
      .where(inArray(partnerContacts.partnerId, ids))
      .orderBy(asc(partnerContacts.position));
    const benefitRows = await this.db
      .select()
      .from(partnerBenefits)
      .where(inArray(partnerBenefits.partnerId, ids));

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      ...(row.description ? { description: row.description } : {}),
      ...(row.usageInstructions
        ? { usageInstructions: row.usageInstructions }
        : {}),
      ...(row.website ? { website: row.website } : {}),
      featured: row.featured,
      ...(row.generalCoupon ? { generalCoupon: row.generalCoupon } : {}),
      status: row.status,
      ...(row.firstPublishedAt
        ? { firstPublishedAt: row.firstPublishedAt }
        : {}),
      categories: categoryRows
        .filter((category) => category.partnerId === row.id)
        .map(({ id, name, status }) => ({ id, name, status })),
      contacts: contactRows
        .filter(
          (contact) => contact.partnerId === row.id && contact.unitId === null,
        )
        .map(toStoredContact),
      units: unitRows
        .filter((unit) => unit.partnerId === row.id)
        .map((unit) => ({
          id: unit.id,
          name: unit.name,
          address: {
            postalCode: unit.postalCode,
            street: unit.street,
            number: unit.number,
            ...(unit.complement ? { complement: unit.complement } : {}),
            neighborhood: unit.neighborhood,
            city: unit.city,
            state: unit.state,
          },
          ...(unit.openingHours ? { openingHours: unit.openingHours } : {}),
          ...(unit.instructions ? { instructions: unit.instructions } : {}),
          status: unit.status,
          contacts: contactRows
            .filter((contact) => contact.unitId === unit.id)
            .map(toStoredContact),
        })),
      benefits: benefitRows
        .filter((benefit) => benefit.partnerId === row.id)
        .map((benefit) => ({
          planId: benefit.planId,
          discountPercentage: benefit.discountPercentage,
          ...(benefit.coupon ? { coupon: benefit.coupon } : {}),
        })),
      version: row.version,
    }));
  }
}
