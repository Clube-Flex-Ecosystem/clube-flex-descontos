import type { Clock } from '../../identity/services.types';
import {
    CommercialConflictError,
    CommercialNotFoundError,
    CommercialValidationError,
} from '../commercial.errors';
import type { CommercialRepository } from '../repositories/commercial.repository';
import type { LeadSourceRepository } from '../repositories/lead-source.repository';
import {
    leadDetail,
    recordLeadEvent,
    versionedLead,
    type CommercialActor,
} from '../domain/commercial-context';

interface Input {
    name: string;
    whatsapp: string;
    email?: string;
    sourceId: string;
    sourceDetail?: string;
    referredBy?: string;
}

export class UpdateCommercialLeadUseCase {
    constructor(
        private readonly leads: CommercialRepository,
        private readonly sources: LeadSourceRepository,
        private readonly clock: Clock,
    ) {}

    async execute(
        actor: CommercialActor,
        id: string,
        version: number,
        input: Input,
    ) {
        const old = await versionedLead(this.leads, actor, id, version, true);
        const source = await this.sources.findById(input.sourceId);
        if (!source) throw new CommercialNotFoundError();
        if (!source.active && source.id !== old.sourceId)
            throw new CommercialValidationError('sourceId', 'INVALID_VALUE');
        if (source.requiresReferral && !input.referredBy)
            throw new CommercialValidationError('referredBy', 'REQUIRED');
        const duplicate = await this.leads.duplicate(input.whatsapp, id);
        if (duplicate)
            throw new CommercialConflictError(
                'DUPLICATE_RESOURCE',
                duplicate.id,
            );
        await this.leads.update(
            id,
            { ...input, version: version + 1 },
            this.clock.now(),
        );
        await recordLeadEvent(
            this.leads,
            this.clock,
            id,
            old.sourceId !== input.sourceId
                ? 'lead.source-changed'
                : 'lead.contact-updated',
            actor,
            { previousSourceId: old.sourceId },
        );
        return leadDetail(this.leads, actor, id);
    }
}
