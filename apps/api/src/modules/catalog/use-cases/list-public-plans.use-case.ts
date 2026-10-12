import type {
    PlanRecord,
    PlanRepository,
} from '../repositories/plan.repository';

export class ListPublicPlansUseCase {
    constructor(private readonly plans: PlanRepository) {}

    async execute(): Promise<PlanRecord[]> {
        return (await this.plans.list()).filter((p) => p.status === 'active');
    }
}
