import type { LeadStage } from '@flex/contracts';
import type { Clock } from '../../identity/services.types';
import { CommercialForbiddenError } from '../commercial.errors';
import type { CommercialRepository } from '../repositories/commercial.repository';
import {
    canEditLead,
    leadDetail,
    recordLeadEvent,
    versionedLead,
    type CommercialActor,
} from '../domain/commercial-context';

export class ChangeLeadStageUseCase {
    constructor(
        private readonly leads: CommercialRepository,
        private readonly clock: Clock,
    ) {}

    async execute(
        actor: CommercialActor,
        id: string,
        version: number,
        stage: LeadStage,
        lossReason?: string,
    ) {
        const old = await versionedLead(this.leads, actor, id, version);
        if (
            !actor.permissions.includes('leads.change-stage') ||
            (!canEditLead(actor, old) && old.assigneeId !== actor.id)
        )
            throw new CommercialForbiddenError();
        await this.leads.update(
            id,
            {
                stage,
                lossReason: stage === 'lost' ? lossReason : null,
                version: version + 1,
            },
            this.clock.now(),
        );
        await recordLeadEvent(
            this.leads,
            this.clock,
            id,
            'lead.stage-changed',
            actor,
            {
                from: old.stage,
                to: stage,
                lossReason,
            },
        );
        return leadDetail(this.leads, actor, id);
    }
}
