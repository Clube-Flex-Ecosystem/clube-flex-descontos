import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../../../infrastructure/database/drizzle/client';
import {
    leadSources,
    leads,
} from '../../../infrastructure/database/drizzle/schema';
import type { LeadSourceRepository } from './lead-source.repository';

export class DrizzleLeadSourceRepository implements LeadSourceRepository {
    async list() {
        const rows = await db
            .select({
                source: leadSources,
                usageCount: sql<number>`count(${leads.id})::int`,
            })
            .from(leadSources)
            .leftJoin(leads, eq(leads.sourceId, leadSources.id))
            .groupBy(leadSources.id)
            .orderBy(asc(leadSources.name));
        return rows.map(({ source, usageCount }) => ({
            ...source,
            usageCount,
        }));
    }

    async findById(id: string) {
        const [source] = await db
            .select()
            .from(leadSources)
            .where(eq(leadSources.id, id));
        return source ?? null;
    }

    async create(input: { name: string; requiresReferral: boolean }) {
        const [source] = await db
            .insert(leadSources)
            .values({ ...input, kind: 'manual' })
            .returning();
        return source!;
    }

    async update(
        id: string,
        version: number,
        changes: {
            name?: string;
            requiresReferral?: boolean;
            active?: boolean;
        },
    ) {
        const [source] = await db
            .update(leadSources)
            .set({ ...changes, version: version + 1 })
            .where(
                and(eq(leadSources.id, id), eq(leadSources.version, version)),
            )
            .returning();
        return source ?? null;
    }

    async delete(id: string, version: number) {
        const [source] = await db
            .delete(leadSources)
            .where(
                and(eq(leadSources.id, id), eq(leadSources.version, version)),
            )
            .returning();
        return source ?? null;
    }
}
