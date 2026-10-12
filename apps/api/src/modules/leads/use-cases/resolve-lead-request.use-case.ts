import type { Clock } from '../../identity/services.types';
import { CommercialNotFoundError } from '../commercial.errors';
import type { CommercialRepository } from '../repositories/commercial.repository';
import {
  leadDetail,
  recordLeadEvent,
  versionedLead,
  type CommercialActor,
} from '../domain/commercial-context';

export class ResolveLeadRequestUseCase {
  constructor(
    private readonly leads: CommercialRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    actor: CommercialActor,
    id: string,
    requestId: string,
    version: number,
  ) {
    await versionedLead(this.leads, actor, id, version, true);
    const now = this.clock.now();
    if (!(await this.leads.resolveRequest(id, requestId, actor.id, now)))
      throw new CommercialNotFoundError();
    const pending = await this.leads.hasPendingRequests(id);
    await this.leads.update(
      id,
      { hasPendingInterest: pending, version: version + 1 },
      now,
    );
    await recordLeadEvent(
      this.leads,
      this.clock,
      id,
      'contact-request.resolved',
      actor,
      { requestId },
    );
    return leadDetail(this.leads, actor, id);
  }
}
