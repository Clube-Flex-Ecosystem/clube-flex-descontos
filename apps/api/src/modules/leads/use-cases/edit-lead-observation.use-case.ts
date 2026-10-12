import type { Clock } from '../../identity/services.types';
import {
    CommercialForbiddenError,
    CommercialNotFoundError,
} from '../commercial.errors';
import type { CommercialRepository } from '../repositories/commercial.repository';
import {
    leadDetail,
    recordLeadEvent,
    versionedLead,
    type CommercialActor,
} from '../domain/commercial-context';

export class EditLeadObservationUseCase {
    constructor(
        private readonly leads: CommercialRepository,
        private readonly clock: Clock,
    ) {}

    async execute(
        actor: CommercialActor,
        id: string,
        observationId: string,
        version: number,
        text: string,
    ) {
        await versionedLead(this.leads, actor, id, version, true);
        const old = await this.leads.observation(id, observationId);
        if (!old) throw new CommercialNotFoundError();
        if (old.authorUserId !== actor.id) throw new CommercialForbiddenError();
        const now = this.clock.now();
        await this.leads.editObservation(observationId, text, now);
        await this.leads.update(id, { version: version + 1 }, now);
        await recordLeadEvent(
            this.leads,
            this.clock,
            id,
            'lead.observation-corrected',
            actor,
            {
                observationId,
                previousText: old.text,
            },
        );
        return leadDetail(this.leads, actor, id);
    }
}
