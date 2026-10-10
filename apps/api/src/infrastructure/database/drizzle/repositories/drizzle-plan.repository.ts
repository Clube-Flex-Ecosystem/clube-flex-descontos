import { normalizeNameKey, type ActiveStatus } from '@flex/contracts';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { DuplicateResourceError } from '../../../../modules/catalog/errors';
import type {
  PlanRecord,
  PlanRepository,
} from '../../../../modules/catalog/repositories/plan.repository.types';
import type { DatabaseExecutor } from '../client';
import { plans } from '../schema';
import { uniqueViolationConstraint } from '../unique-violation';

type PlanRow = typeof plans.$inferSelect;

function toRecord(row: PlanRow): PlanRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    version: row.version,
  };
}

export class DrizzlePlanRepository implements PlanRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async list(): Promise<PlanRecord[]> {
    const rows = await this.db.select().from(plans).orderBy(asc(plans.nameKey));
    return rows.map(toRecord);
  }

  async findById(id: string): Promise<PlanRecord | null> {
    const [row] = await this.db.select().from(plans).where(eq(plans.id, id));
    return row ? toRecord(row) : null;
  }

  async findByIds(ids: readonly string[]): Promise<PlanRecord[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(plans)
      .where(inArray(plans.id, [...ids]));
    return rows.map(toRecord);
  }

  async slugExists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.slug, slug));
    return Boolean(row);
  }

  async create(
    input: { name: string; slug: string },
    now: Date,
  ): Promise<PlanRecord> {
    try {
      const [row] = await this.db
        .insert(plans)
        .values({
          name: input.name,
          nameKey: normalizeNameKey(input.name),
          slug: input.slug,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (!row) throw new Error('Falha ao criar o plano');
      return toRecord(row);
    } catch (error) {
      throw translateUniqueViolation(error);
    }
  }

  async update(
    id: string,
    expectedVersion: number,
    changes: { name?: string; status?: ActiveStatus },
    now: Date,
  ): Promise<PlanRecord | null> {
    try {
      const [row] = await this.db
        .update(plans)
        .set({
          ...(changes.name !== undefined
            ? { name: changes.name, nameKey: normalizeNameKey(changes.name) }
            : {}),
          ...(changes.status !== undefined ? { status: changes.status } : {}),
          version: sql`${plans.version} + 1`,
          updatedAt: now,
        })
        .where(and(eq(plans.id, id), eq(plans.version, expectedVersion)))
        .returning();
      return row ? toRecord(row) : null;
    } catch (error) {
      throw translateUniqueViolation(error);
    }
  }
}

function translateUniqueViolation(error: unknown): unknown {
  switch (uniqueViolationConstraint(error)) {
    case 'plans_name_key_unique':
      return new DuplicateResourceError([
        { field: 'name', code: 'DUPLICATE_NAME' },
      ]);
    case 'plans_slug_unique':
      return new DuplicateResourceError([
        { field: 'slug', code: 'DUPLICATE_SLUG' },
      ]);
    default:
      return error;
  }
}
