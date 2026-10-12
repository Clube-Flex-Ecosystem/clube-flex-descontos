import { CommercialNotFoundError } from '../commercial.errors';
import type { LeadSourceRepository } from '../repositories/lead-source.repository';

export class GetLeadSourceUseCase {
    constructor(private readonly sources: LeadSourceRepository) {}
    async execute(id: string) {
        const source = (await this.sources.list()).find(
            (item) => item.id === id,
        );
        if (!source) throw new CommercialNotFoundError();
        return source;
    }
}
