import type { Clock } from '../../identity/services.types';
import {
    CommercialForbiddenError,
    CommercialValidationError,
} from '../commercial.errors';
import type { CommercialRepository } from '../repositories/commercial.repository';
import {
    leadDetail,
    recordLeadEvent,
    versionedLead,
    type CommercialActor,
} from '../domain/commercial-context';

export class AssignLeadUseCase {
    constructor(
        private readonly leads: CommercialRepository,
        private readonly clock: Clock,
    ) {}

    async execute(
        actor: CommercialActor,
        id: string,
        version: number,
        assigneeId: string | null,
    ) {
        const old = await versionedLead(this.leads, actor, id, version);
        const selfReturn = old.assigneeId === actor.id && assigneeId === null;
        if (!selfReturn && !actor.permissions.includes('leads.assign'))
            throw new CommercialForbiddenError();
        if (assigneeId && !(await this.leads.activeUser(assigneeId)))
            throw new CommercialValidationError('assigneeId', 'INVALID_VALUE');
        await this.leads.update(
            id,
            { assigneeId, version: version + 1 },
            this.clock.now(),
        );
        await recordLeadEvent(
            this.leads,
            this.clock,
            id,
            'lead.assignee-changed',
            actor,
            {
                from: old.assigneeId,
                to: assigneeId,
            },
        );
        return leadDetail(
            this.leads,
            { ...actor, permissions: [...actor.permissions, 'leads.view-all'] },
            id,
        );
    }
}
