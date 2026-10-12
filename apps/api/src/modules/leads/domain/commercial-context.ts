import type { Clock } from '../../identity/services.types';
import {
  CommercialConflictError,
  CommercialForbiddenError,
  CommercialNotFoundError,
} from '../commercial.errors';
import type {
  CommercialRepository,
  LeadRecord,
} from '../repositories/commercial.repository';

export interface CommercialActor {
  id: string;
  fullName: string;
  username: string;
  permissions: readonly string[];
}

export const canSeeLead = (
  actor: CommercialActor,
  lead: { assigneeId: string | null },
) =>
  actor.permissions.includes('leads.view-all') ||
  (actor.permissions.includes('leads.view-own') &&
    lead.assigneeId === actor.id);

export const canEditLead = (
  actor: CommercialActor,
  lead: { assigneeId: string | null },
) =>
  actor.permissions.includes('leads.update') &&
  (lead.assigneeId === actor.id ||
    actor.permissions.includes('leads.view-all'));

export async function visibleLead(
  repository: CommercialRepository,
  actor: CommercialActor,
  id: string,
): Promise<LeadRecord> {
  const lead = await repository.row(id);
  if (!lead || !canSeeLead(actor, lead)) throw new CommercialNotFoundError();
  return lead;
}

export async function versionedLead(
  repository: CommercialRepository,
  actor: CommercialActor,
  id: string,
  version: number,
  edit = false,
): Promise<LeadRecord> {
  const lead = await visibleLead(repository, actor, id);
  if (lead.anonymizedAt)
    throw new CommercialConflictError('INVALID_RESOURCE_STATE');
  if (edit && !canEditLead(actor, lead)) throw new CommercialForbiddenError();
  if (lead.version !== version) throw new CommercialConflictError();
  return lead;
}

export async function leadDetail(
  repository: CommercialRepository,
  actor: CommercialActor,
  id: string,
) {
  const lead = await visibleLead(repository, actor, id);
  return repository.detail(lead);
}

export function recordLeadEvent(
  repository: CommercialRepository,
  clock: Clock,
  leadId: string,
  type: string,
  actor: CommercialActor,
  data?: Record<string, unknown>,
) {
  return repository.event(leadId, type, actor.id, clock.now(), data);
}
