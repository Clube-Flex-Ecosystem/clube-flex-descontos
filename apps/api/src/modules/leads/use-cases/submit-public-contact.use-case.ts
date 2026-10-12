import { CONTACT_CONSENT, type PublicContactRequest } from '@flex/contracts';
import type { Clock } from '../../identity/services.types';
import type { PublicContactRepository } from '../repositories/public-contact.repository';

export class OutdatedConsentError extends Error {}

export class SubmitPublicContactUseCase {
  constructor(
    private readonly repository: PublicContactRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: PublicContactRequest): Promise<void> {
    if (input.consentVersion !== CONTACT_CONSENT.version) {
      throw new OutdatedConsentError();
    }
    const now = this.clock.now();
    await this.repository.run(async (tx) => {
      let sourceId = await tx.findSource();
      if (!sourceId)
        sourceId = (await tx.createSource()) ?? (await tx.findSource());
      if (!sourceId) throw new Error('Automatic lead source was not created');

      let leadId = await tx.findLead(input.whatsapp);
      let existing = Boolean(leadId);
      if (!leadId) {
        leadId = await tx.createLead(input, sourceId, now);
        if (!leadId) {
          existing = true;
          leadId = await tx.findLead(input.whatsapp);
          if (leadId) await tx.markPending(leadId, now);
        }
      } else {
        await tx.markPending(leadId, now);
      }
      if (!leadId) throw new Error('Lead was not created');

      const requestId = await tx.createRequest(leadId, input, now);
      await tx.recordConsent(leadId, requestId, input, now);
      await tx.recordHistory(
        leadId,
        requestId,
        input.consentVersion,
        existing,
        now,
      );
    });
  }
}
