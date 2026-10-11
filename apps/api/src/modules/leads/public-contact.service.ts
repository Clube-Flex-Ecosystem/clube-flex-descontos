import { eq } from 'drizzle-orm';
import type { PublicContactRequest } from '@flex/contracts';
import { CONTACT_CONSENT } from '@flex/contracts';
import type { Database } from '../../infrastructure/database/drizzle/client';
import {
  leadConsents,
  leadContactRequests,
  leadHistory,
  leads,
  leadSources,
} from '../../infrastructure/database/drizzle/schema';
import type { Clock } from '../identity/services.types';

const SOURCE_NAME = 'catálogo/site';

export class PublicContactService {
  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
  ) {}

  consent() {
    return CONTACT_CONSENT;
  }

  async submit(input: PublicContactRequest): Promise<void> {
    if (input.consentVersion !== CONTACT_CONSENT.version) {
      throw new OutdatedConsentError();
    }
    const now = this.clock.now();
    await this.db.transaction(async (tx) => {
      let source = await tx.query.leadSources.findFirst({
        where: eq(leadSources.name, SOURCE_NAME),
      });
      if (!source) {
        [source] = await tx
          .insert(leadSources)
          .values({
            name: SOURCE_NAME,
            kind: 'automatic',
            protected: true,
          })
          .onConflictDoNothing()
          .returning();
        source ??= await tx.query.leadSources.findFirst({
          where: eq(leadSources.name, SOURCE_NAME),
        });
      }
      if (!source) throw new Error('Automatic lead source was not created');

      let lead = await tx.query.leads.findFirst({
        where: eq(leads.whatsapp, input.whatsapp),
      });
      let existing = Boolean(lead);
      if (!lead) {
        [lead] = await tx
          .insert(leads)
          .values({
            name: input.name,
            whatsapp: input.whatsapp,
            email: input.email,
            sourceId: source.id,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing()
          .returning();
        if (!lead) {
          existing = true;
          lead = await tx.query.leads.findFirst({
            where: eq(leads.whatsapp, input.whatsapp),
          });
          if (lead) {
            await tx
              .update(leads)
              .set({ hasPendingInterest: true, updatedAt: now })
              .where(eq(leads.id, lead.id));
          }
        }
      } else {
        await tx
          .update(leads)
          .set({
            hasPendingInterest: true,
            updatedAt: now,
          })
          .where(eq(leads.id, lead.id));
      }
      if (!lead) throw new Error('Lead was not created');

      const [contactRequest] = await tx
        .insert(leadContactRequests)
        .values({
          leadId: lead.id,
          submittedName: input.name,
          submittedWhatsapp: input.whatsapp,
          submittedEmail: input.email,
          source: input.source,
          createdAt: now,
        })
        .returning();
      if (!contactRequest) throw new Error('Contact request was not created');
      await tx.insert(leadConsents).values({
        leadId: lead.id,
        contactRequestId: contactRequest.id,
        version: input.consentVersion,
        source: input.source,
        acceptedAt: now,
      });
      await tx.insert(leadHistory).values({
        leadId: lead.id,
        type: existing ? 'contact-request.received' : 'lead.created',
        occurredAt: now,
        data: {
          contactRequestId: contactRequest.id,
          consentVersion: input.consentVersion,
        },
      });
    });
  }
}

export class OutdatedConsentError extends Error {}
