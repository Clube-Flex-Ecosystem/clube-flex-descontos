import { normalizeNameKey, type ActiveStatus } from '@flex/contracts';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { DuplicateResourceError } from '../errors';
import type { CategoryRecord, CategoryRepository } from './category.repository';
import {
    db,
    type DatabaseExecutor,
} from '../../../infrastructure/database/drizzle/client';
import { categories } from '../../../infrastructure/database/drizzle/schema';
import { uniqueViolationConstraint } from '../../../infrastructure/database/drizzle/unique-violation';

type CategoryRow = typeof categories.$inferSelect;

function toRecord(row: CategoryRow): CategoryRecord {
    return {
        id: row.id,
        name: row.name,
        status: row.status,
        version: row.version,
    };
}

export class DrizzleCategoryRepository implements CategoryRepository {
    private transaction?: DatabaseExecutor;

    private get db(): DatabaseExecutor {
        return this.transaction ?? db;
    }

    /** Escopo interno usado somente por Unit of Work. */
    withTransaction(transaction: DatabaseExecutor): this {
        this.transaction = transaction;
        return this;
    }

    async list(): Promise<CategoryRecord[]> {
        const rows = await this.db
            .select()
            .from(categories)
            .orderBy(asc(categories.nameKey));
        return rows.map(toRecord);
    }

    async findById(id: string): Promise<CategoryRecord | null> {
        const [row] = await this.db
            .select()
            .from(categories)
            .where(eq(categories.id, id));
        return row ? toRecord(row) : null;
    }

    async findByIds(ids: readonly string[]): Promise<CategoryRecord[]> {
        if (ids.length === 0) return [];
        const rows = await this.db
            .select()
            .from(categories)
            .where(inArray(categories.id, [...ids]));
        return rows.map(toRecord);
    }

    async create(input: { name: string }, now: Date): Promise<CategoryRecord> {
        try {
            const [row] = await this.db
                .insert(categories)
                .values({
                    name: input.name,
                    nameKey: normalizeNameKey(input.name),
                    createdAt: now,
                    updatedAt: now,
                })
                .returning();
            if (!row) throw new Error('Falha ao criar a categoria');
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
    ): Promise<CategoryRecord | null> {
        try {
            const [row] = await this.db
                .update(categories)
                .set({
                    ...(changes.name !== undefined
                        ? {
                              name: changes.name,
                              nameKey: normalizeNameKey(changes.name),
                          }
                        : {}),
                    ...(changes.status !== undefined
                        ? { status: changes.status }
                        : {}),
                    version: sql`${categories.version} + 1`,
                    updatedAt: now,
                })
                .where(
                    and(
                        eq(categories.id, id),
                        eq(categories.version, expectedVersion),
                    ),
                )
                .returning();
            return row ? toRecord(row) : null;
        } catch (error) {
            throw translateUniqueViolation(error);
        }
    }
}

function translateUniqueViolation(error: unknown): unknown {
    return uniqueViolationConstraint(error) === 'categories_name_key_unique'
        ? new DuplicateResourceError([
              { field: 'name', code: 'DUPLICATE_NAME' },
          ])
        : error;
}
