import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type {
    Lead,
    LeadHistoryEvent,
    LeadStage,
    LeadSummary,
} from '@flex/contracts';
import { db } from '../../../infrastructure/database/drizzle/client';
import { DrizzleAuditRepository } from '../../audit/repositories/drizzle-audit.repository';
import { CommercialConflictError } from '../commercial.errors';
import {
    leadConsents,
    leadContactRequests,
    leadHistory,
    leadObservations,
    leads,
    leadSources,
    users,
} from '../../../infrastructure/database/drizzle/schema';
import type {
    CommercialRepository,
    LeadChanges,
    LeadRecord,
    ObservationRecord,
} from './commercial.repository';

const ANONYMIZED_NAME = 'Lead anonimizado';
const anonymizedWhatsapp = (leadId: string) => `anonimizado:${leadId}`;

export class DrizzleCommercialRepository implements CommercialRepository {
    async listRows(): Promise<LeadRecord[]> {
        const rows = await db
            .select()
            .from(leads)
            .where(sql`${leads.anonymizedAt} is null`)
            .orderBy(desc(leads.updatedAt));
        return rows.map((row) => ({ ...row, stage: row.stage as LeadStage }));
    }

    async row(id: string): Promise<LeadRecord | null> {
        const [row] = await db.select().from(leads).where(eq(leads.id, id));
        return row ? { ...row, stage: row.stage as LeadStage } : null;
    }

    async summary(l: LeadRecord): Promise<LeadSummary> {
        const [source] = await db
            .select()
            .from(leadSources)
            .where(eq(leadSources.id, l.sourceId));
        const owner = l.assigneeId
            ? (
                  await db
                      .select({ id: users.id, fullName: users.fullName })
                      .from(users)
                      .where(eq(users.id, l.assigneeId))
              )[0]
            : undefined;
        const usage =
            (
                await db
                    .select({ count: sql<number>`count(*)::int` })
                    .from(leads)
                    .where(eq(leads.sourceId, l.sourceId))
            )[0]?.count ?? 0;
        return {
            id: l.id,
            name: l.name,
            whatsapp: l.whatsapp,
            ...(l.email ? { email: l.email } : {}),
            stage: l.stage as LeadStage,
            source: { ...source!, usageCount: usage },
            ...(owner ? { assignee: owner } : {}),
            hasPendingInterest: l.hasPendingInterest,
            ...(l.anonymizedAt ? { anonymized: true } : {}),
            version: l.version,
            updatedAt: l.updatedAt.toISOString(),
        };
    }

    async detail(l: LeadRecord): Promise<Lead> {
        const id = l.id;
        const summary = await this.summary(l);
        const observations = await db
            .select({
                id: leadObservations.id,
                text: leadObservations.text,
                createdAt: leadObservations.createdAt,
                updatedAt: leadObservations.updatedAt,
                authorId: users.id,
                authorName: users.fullName,
            })
            .from(leadObservations)
            .innerJoin(users, eq(users.id, leadObservations.authorUserId))
            .where(eq(leadObservations.leadId, id))
            .orderBy(desc(leadObservations.createdAt));
        const requests = await db
            .select({
                request: leadContactRequests,
                resolverId: users.id,
                resolverName: users.fullName,
            })
            .from(leadContactRequests)
            .leftJoin(users, eq(users.id, leadContactRequests.resolvedBy))
            .where(eq(leadContactRequests.leadId, id))
            .orderBy(desc(leadContactRequests.createdAt));
        return {
            ...summary,
            ...(l.sourceDetail ? { sourceDetail: l.sourceDetail } : {}),
            ...(l.referredBy ? { referredBy: l.referredBy } : {}),
            ...(l.lossReason ? { lossReason: l.lossReason } : {}),
            observations: observations.map((o) => ({
                id: o.id,
                text: o.text,
                author: { id: o.authorId, fullName: o.authorName },
                createdAt: o.createdAt.toISOString(),
                updatedAt: o.updatedAt.toISOString(),
            })),
            contactRequests: requests.map(
                ({ request: r, resolverId, resolverName }) => ({
                    id: r.id,
                    submittedName: r.submittedName,
                    submittedWhatsapp: r.submittedWhatsapp,
                    ...(r.submittedEmail
                        ? { submittedEmail: r.submittedEmail }
                        : {}),
                    source: r.source,
                    createdAt: r.createdAt.toISOString(),
                    ...(r.resolvedAt
                        ? { resolvedAt: r.resolvedAt.toISOString() }
                        : {}),
                    ...(resolverId && resolverName
                        ? {
                              resolvedBy: {
                                  id: resolverId,
                                  fullName: resolverName,
                              },
                          }
                        : {}),
                }),
            ),
        };
    }

    async duplicate(whatsapp: string, exceptId?: string) {
        const [row] = await db
            .select({ id: leads.id, assigneeId: leads.assigneeId })
            .from(leads)
            .where(
                exceptId
                    ? and(
                          eq(leads.whatsapp, whatsapp),
                          sql`${leads.id} <> ${exceptId}`,
                      )
                    : eq(leads.whatsapp, whatsapp),
            );
        return row ?? null;
    }

    async create(
        input: {
            name: string;
            whatsapp: string;
            email?: string;
            sourceId: string;
            sourceDetail?: string;
            referredBy?: string;
            assigneeId: string | null;
        },
        now: Date,
    ): Promise<string> {
        const [row] = await db
            .insert(leads)
            .values({ ...input, createdAt: now, updatedAt: now })
            .returning({ id: leads.id });
        return row!.id;
    }

    async update(id: string, changes: LeadChanges, now: Date): Promise<void> {
        await db
            .update(leads)
            .set({ ...changes, updatedAt: now })
            .where(eq(leads.id, id));
    }

    async event(
        leadId: string,
        type: string,
        actorId: string,
        now: Date,
        data?: Record<string, unknown>,
    ): Promise<void> {
        await db.insert(leadHistory).values({
            leadId,
            type,
            actorUserId: actorId,
            occurredAt: now,
            data,
        });
    }

    async activeUser(id: string): Promise<boolean> {
        const [user] = await db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.id, id), eq(users.status, 'active')));
        return Boolean(user);
    }

    async createObservation(
        leadId: string,
        authorId: string,
        text: string,
        now: Date,
    ): Promise<string> {
        const [observation] = await db
            .insert(leadObservations)
            .values({
                leadId,
                authorUserId: authorId,
                text,
                createdAt: now,
                updatedAt: now,
            })
            .returning({ id: leadObservations.id });
        return observation!.id;
    }

    async observation(
        leadId: string,
        observationId: string,
    ): Promise<ObservationRecord | null> {
        const [observation] = await db
            .select()
            .from(leadObservations)
            .where(
                and(
                    eq(leadObservations.id, observationId),
                    eq(leadObservations.leadId, leadId),
                ),
            );
        return observation ?? null;
    }

    async editObservation(
        observationId: string,
        text: string,
        now: Date,
    ): Promise<void> {
        await db
            .update(leadObservations)
            .set({ text, updatedAt: now })
            .where(eq(leadObservations.id, observationId));
    }

    async resolveRequest(
        leadId: string,
        requestId: string,
        actorId: string,
        now: Date,
    ): Promise<boolean> {
        const rows = await db
            .update(leadContactRequests)
            .set({ resolvedAt: now, resolvedBy: actorId })
            .where(
                and(
                    eq(leadContactRequests.id, requestId),
                    eq(leadContactRequests.leadId, leadId),
                    sql`${leadContactRequests.resolvedAt} is null`,
                ),
            )
            .returning({ id: leadContactRequests.id });
        return rows.length > 0;
    }

    async hasPendingRequests(leadId: string): Promise<boolean> {
        const rows = await db
            .select({ id: leadContactRequests.id })
            .from(leadContactRequests)
            .where(
                and(
                    eq(leadContactRequests.leadId, leadId),
                    sql`${leadContactRequests.resolvedAt} is null`,
                ),
            );
        return rows.length > 0;
    }

    async history(id: string): Promise<LeadHistoryEvent[]> {
        const rows = await db
            .select({
                event: leadHistory,
                actorId: users.id,
                actorName: users.fullName,
            })
            .from(leadHistory)
            .leftJoin(users, eq(users.id, leadHistory.actorUserId))
            .where(eq(leadHistory.leadId, id))
            .orderBy(desc(leadHistory.occurredAt));
        return rows.map(({ event: e, actorId, actorName }) => ({
            id: e.id,
            type: e.type,
            occurredAt: e.occurredAt.toISOString(),
            ...(actorId && actorName
                ? { actor: { id: actorId, fullName: actorName } }
                : {}),
            ...(e.data ? { data: e.data as Record<string, unknown> } : {}),
        }));
    }

    async historyTypes(id: string): Promise<string[]> {
        const rows = await db
            .select({ type: leadHistory.type })
            .from(leadHistory)
            .where(eq(leadHistory.leadId, id));
        return rows.map(({ type }) => type);
    }

    async remove(
        id: string,
        version: number,
        outcome: 'delete' | 'anonymize',
        actor: { id: string; username: string },
        stage: LeadStage,
        now: Date,
    ): Promise<boolean> {
        return db.transaction(async (tx) => {
            const audit = new DrizzleAuditRepository().withTransaction(tx);
            const record = {
                occurredAt: now,
                actorUserId: actor.id,
                actorLabel: actor.username,
                targetType: 'lead',
                targetId: id,
                targetLabel: `Lead ${id.slice(0, 8)}`,
            };
            if (outcome === 'delete') {
                await tx
                    .delete(leadConsents)
                    .where(eq(leadConsents.leadId, id));
                await tx
                    .delete(leadContactRequests)
                    .where(eq(leadContactRequests.leadId, id));
                await tx.delete(leadHistory).where(eq(leadHistory.leadId, id));
                const removed = await tx
                    .delete(leads)
                    .where(and(eq(leads.id, id), eq(leads.version, version)))
                    .returning({ id: leads.id });
                if (removed.length === 0) throw new CommercialConflictError();
                await audit.record({
                    ...record,
                    action: 'lead.deleted',
                    before: { personalData: 'present', stage },
                    after: { personalData: 'deleted' },
                });
                return true;
            }
            const [updated] = await tx
                .update(leads)
                .set({
                    name: ANONYMIZED_NAME,
                    whatsapp: anonymizedWhatsapp(id),
                    email: null,
                    referredBy: null,
                    hasPendingInterest: false,
                    anonymizedAt: now,
                    version: version + 1,
                    updatedAt: now,
                })
                .where(and(eq(leads.id, id), eq(leads.version, version)))
                .returning({ id: leads.id });
            if (!updated) throw new CommercialConflictError();
            await tx
                .update(leadContactRequests)
                .set({
                    submittedName: ANONYMIZED_NAME,
                    submittedWhatsapp: anonymizedWhatsapp(id),
                    submittedEmail: null,
                })
                .where(eq(leadContactRequests.leadId, id));
            await tx.insert(leadHistory).values({
                leadId: id,
                type: 'lead.anonymized',
                actorUserId: actor.id,
                occurredAt: now,
            });
            await audit.record({
                ...record,
                action: 'lead.anonymized',
                before: { personalData: 'present', stage },
                after: { personalData: 'anonymized' },
            });
            return true;
        });
    }

    async activeUsers() {
        return db
            .select({ id: users.id, fullName: users.fullName })
            .from(users)
            .where(eq(users.status, 'active'))
            .orderBy(asc(users.fullName));
    }
}
