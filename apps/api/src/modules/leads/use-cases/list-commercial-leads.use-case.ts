import type { LeadSummary } from '@flex/contracts';
import type { CommercialRepository } from '../repositories/commercial.repository';
import { canSeeLead, type CommercialActor } from '../domain/commercial-context';

export class ListCommercialLeadsUseCase {
  constructor(private readonly leads: CommercialRepository) {}
  async execute(actor: CommercialActor): Promise<LeadSummary[]> {
    const rows = await this.leads.listRows();
    return Promise.all(
      rows
        .filter((lead) => canSeeLead(actor, lead))
        .map((lead) => this.leads.summary(lead)),
    );
  }
}
