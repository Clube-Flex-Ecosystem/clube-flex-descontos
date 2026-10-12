import type { LeadHistoryEvent } from '@flex/contracts';
import type { CommercialRepository } from '../repositories/commercial.repository';
import {
  visibleLead,
  type CommercialActor,
} from '../domain/commercial-context';

export class GetLeadHistoryUseCase {
  constructor(private readonly leads: CommercialRepository) {}
  async execute(
    actor: CommercialActor,
    id: string,
  ): Promise<LeadHistoryEvent[]> {
    await visibleLead(this.leads, actor, id);
    return this.leads.history(id);
  }
}
