import { ResourceNotFoundError } from '../errors';
import type {
    PlanRecord,
    PlanRepository,
} from '../repositories/plan.repository';

export class GetPlanUseCase {
    constructor(private readonly plans: PlanRepository) {}

    async execute(input: { id: string }): Promise<PlanRecord> {
        const plan = await this.plans.findById(input.id);
        if (!plan) throw new ResourceNotFoundError();
        return plan;
    }
}
