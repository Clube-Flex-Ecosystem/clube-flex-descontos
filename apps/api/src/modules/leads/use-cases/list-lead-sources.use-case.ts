import type { LeadSourceRepository } from '../repositories/lead-source.repository';

export class ListLeadSourcesUseCase {
    constructor(private readonly sources: LeadSourceRepository) {}
    execute() {
        return this.sources.list();
    }
}
