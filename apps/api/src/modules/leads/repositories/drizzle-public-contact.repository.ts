import { eq } from 'drizzle-orm';
import type { PublicContactRequest } from '@flex/contracts';
import { db } from '../../../infrastructure/database/drizzle/client';
import {
    leadConsents,
    leadContactRequests,
    leadHistory,
    leads,
    leadSources,
} from '../../../infrastructure/database/drizzle/schema';
import type {
    PublicContactRepository,
    PublicContactTransaction,
} from './public-contact.repository';

const SOURCE_NAME = 'catálogo/site';

export class DrizzlePublicContactRepository implements PublicContactRepository {
    run<T>(
        work: (transaction: PublicContactTransaction) => Promise<T>,
    ): Promise<T> {
        return db.transaction(async (tx) => {
            const repository: PublicContactTransaction = {
                async findSource() {
                    const [source] = await tx
                        .select({ id: leadSources.id })
                        .from(leadSources)
                        .where(eq(leadSources.name, SOURCE_NAME));
                    return source?.id ?? null;
                },
                async createSource() {
                    const [source] = await tx
                        .insert(leadSources)
                        .values({
                            name: SOURCE_NAME,
                            kind: 'automatic',
                            protected: true,
                        })
                        .onConflictDoNothing()
                        .returning({ id: leadSources.id });
                    return source?.id ?? null;
                },
                async findLead(whatsapp) {
                    const [lead] = await tx
                        .select({ id: leads.id })
                        .from(leads)
                        .where(eq(leads.whatsapp, whatsapp));
                    return lead?.id ?? null;
                },
                async createLead(
                    input: PublicContactRequest,
                    sourceId: string,
                    now: Date,
                ) {
                    const [lead] = await tx
                        .insert(leads)
                        .values({
                            name: input.name,
                            whatsapp: input.whatsapp,
                            email: input.email,
                            sourceId,
                            createdAt: now,
                            updatedAt: now,
                        })
                        .onConflictDoNothing()
                        .returning({ id: leads.id });
                    return lead?.id ?? null;
                },
                async markPending(leadId, now) {
                    await tx
                        .update(leads)
                        .set({ hasPendingInterest: true, updatedAt: now })
                        .where(eq(leads.id, leadId));
                },
                async createRequest(leadId, input, now) {
                    const [request] = await tx
                        .insert(leadContactRequests)
                        .values({
                            leadId,
                            submittedName: input.name,
                            submittedWhatsapp: input.whatsapp,
                            submittedEmail: input.email,
                            source: input.source,
                            createdAt: now,
                        })
                        .returning({ id: leadContactRequests.id });
                    if (!request)
                        throw new Error('Contact request was not created');
                    return request.id;
                },
                async recordConsent(leadId, requestId, input, now) {
                    await tx.insert(leadConsents).values({
                        leadId,
                        contactRequestId: requestId,
                        version: input.consentVersion,
                        source: input.source,
                        acceptedAt: now,
                    });
                },
                async recordHistory(
                    leadId,
                    requestId,
                    consentVersion,
                    existing,
                    now,
                ) {
                    await tx.insert(leadHistory).values({
                        leadId,
                        type: existing
                            ? 'contact-request.received'
                            : 'lead.created',
                        occurredAt: now,
                        data: { contactRequestId: requestId, consentVersion },
                    });
                },
            };
            return work(repository);
        });
    }
}
