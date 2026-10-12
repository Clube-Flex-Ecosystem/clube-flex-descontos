import type { Clock } from '../../identity/services.types';
import type { CommercialRepository } from '../repositories/commercial.repository';
import {
  leadDetail,
  recordLeadEvent,
  versionedLead,
  type CommercialActor,
} from '../domain/commercial-context';

export class AddLeadObservationUseCase {
  constructor(
    private readonly leads: CommercialRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    actor: CommercialActor,
    id: string,
    version: number,
    text: string,
  ) {
    await versionedLead(this.leads, actor, id, version, true);
    const now = this.clock.now();
    const observationId = await this.leads.createObservation(
      id,
      actor.id,
      text,
      now,
    );
    await this.leads.update(id, { version: version + 1 }, now);
    await recordLeadEvent(
      this.leads,
      this.clock,
      id,
      'lead.observation-created',
      actor,
      { observationId },
    );
    return leadDetail(this.leads, actor, id);
  }
}
