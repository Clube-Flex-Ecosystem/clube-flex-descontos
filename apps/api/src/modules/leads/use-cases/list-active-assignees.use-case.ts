import type { CommercialRepository } from '../repositories/commercial.repository';

export class ListActiveAssigneesUseCase {
    constructor(private readonly leads: CommercialRepository) {}
    execute() {
        return this.leads.activeUsers();
    }
}
