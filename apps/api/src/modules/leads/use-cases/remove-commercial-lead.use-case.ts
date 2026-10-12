import { leadRemovalOutcome, type LeadRemoval } from '@flex/contracts';
import type { Clock } from '../../identity/services.types';
import { CommercialConflictError } from '../commercial.errors';
import type { CommercialRepository } from '../repositories/commercial.repository';
import {
  leadDetail,
  visibleLead,
  type CommercialActor,
} from '../domain/commercial-context';

export class RemoveCommercialLeadUseCase {
  constructor(
    private readonly leads: CommercialRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    actor: CommercialActor,
    id: string,
    version: number,
  ): Promise<LeadRemoval> {
    const current = await visibleLead(this.leads, actor, id);
    const lastRepresentation = await leadDetail(this.leads, actor, id);
    if (current.anonymizedAt) {
      return { ...lastRepresentation, deleted: false, anonymized: true };
    }
    if (current.version !== version) throw new CommercialConflictError();
    const history = await this.leads.historyTypes(id);
    const outcome = leadRemovalOutcome({
      observationCount: lastRepresentation.observations.length,
      eventTypes: history,
    });
    await this.leads.remove(
      id,
      version,
      outcome,
      actor,
      current.stage,
      this.clock.now(),
    );
    if (outcome === 'delete') {
      return { ...lastRepresentation, deleted: true, anonymized: false };
    }
    const confirmed = await leadDetail(
      this.leads,
      { ...actor, permissions: [...actor.permissions, 'leads.view-all'] },
      id,
    );
    return { ...confirmed, deleted: false, anonymized: true };
  }
}
