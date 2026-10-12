import type {
    PlanRecord,
    PlanRepository,
} from '../repositories/plan.repository';

export class ListPlansUseCase {
    constructor(private readonly plans: PlanRepository) {}

    execute(): Promise<PlanRecord[]> {
        return this.plans.list();
    }
}
