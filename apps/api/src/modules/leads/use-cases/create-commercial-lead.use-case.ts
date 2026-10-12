import type { Clock } from '../../identity/services.types';
import {
  CommercialConflictError,
  CommercialNotFoundError,
  CommercialValidationError,
} from '../commercial.errors';
import type { CommercialRepository } from '../repositories/commercial.repository';
import type { LeadSourceRepository } from '../repositories/lead-source.repository';
import {
  canSeeLead,
  leadDetail,
  recordLeadEvent,
  type CommercialActor,
} from '../domain/commercial-context';

interface Input {
  name: string;
  whatsapp: string;
  email?: string;
  sourceId: string;
  sourceDetail?: string;
  referredBy?: string;
  leaveUnassigned: boolean;
}

export class CreateCommercialLeadUseCase {
  constructor(
    private readonly leads: CommercialRepository,
    private readonly sources: LeadSourceRepository,
    private readonly clock: Clock,
  ) {}

  async execute(actor: CommercialActor, input: Input) {
    const source = await this.sources.findById(input.sourceId);
    if (!source) throw new CommercialNotFoundError();
    if (!source.active || source.kind !== 'manual')
      throw new CommercialValidationError('sourceId', 'INVALID_VALUE');
    if (source.requiresReferral && !input.referredBy)
      throw new CommercialValidationError('referredBy', 'REQUIRED');
    const duplicate = await this.leads.duplicate(input.whatsapp);
    if (duplicate)
      throw new CommercialConflictError(
        'DUPLICATE_RESOURCE',
        canSeeLead(actor, duplicate) ? duplicate.id : undefined,
      );
    const id = await this.leads.create(
      {
        name: input.name,
        whatsapp: input.whatsapp,
        email: input.email,
        sourceId: input.sourceId,
        sourceDetail: input.sourceDetail,
        referredBy: input.referredBy,
        assigneeId: input.leaveUnassigned ? null : actor.id,
      },
      this.clock.now(),
    );
    await recordLeadEvent(this.leads, this.clock, id, 'lead.created', actor, {
      sourceId: input.sourceId,
    });
    return leadDetail(this.leads, actor, id);
  }
}
