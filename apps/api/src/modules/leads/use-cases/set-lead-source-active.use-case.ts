import { CommercialConflictError } from '../commercial.errors';
import type { LeadSourceRepository } from '../repositories/lead-source.repository';
import { CommercialNotFoundError } from '../commercial.errors';

export class SetLeadSourceActiveUseCase {
    constructor(private readonly sources: LeadSourceRepository) {}
    async execute(id: string, version: number, active: boolean) {
        const current = await this.sources.findById(id);
        if (!current) throw new CommercialNotFoundError();
        if (current.protected && !active)
            throw new CommercialConflictError('PROTECTED_RESOURCE');
        const source = await this.sources.update(id, version, { active });
        if (!source) throw new CommercialConflictError();
        const usageCount =
            (await this.sources.list()).find((x) => x.id === id)?.usageCount ??
            0;
        return { ...source, usageCount };
    }
}
