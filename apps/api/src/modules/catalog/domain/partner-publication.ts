import { publicationIssues, type PublicationCandidate } from '@flex/contracts';
import { PublicationRequirementsError } from '../errors';

/**
 * Garante as condições de publicação (RN-001). A regra em si vive nos contratos, de modo
 * que o dashboard apresenta exatamente as mesmas pendências.
 */
export function assertPublishable(
    candidate: PublicationCandidate,
    activePlanIds: ReadonlySet<string>,
): void {
    const issues = publicationIssues(candidate, activePlanIds);
    if (issues.length > 0) throw new PublicationRequirementsError(issues);
}
