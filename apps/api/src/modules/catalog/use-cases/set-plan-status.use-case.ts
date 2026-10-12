import type { ActiveStatus } from '@flex/contracts';
import { failVersionedUpdate } from '../domain/optimistic-concurrency';
import { ResourceNotFoundError } from '../errors';
import type {
    PlanRecord,
    PlanRepository,
} from '../repositories/plan.repository';
import type { Clock } from '../../identity/services.types';

export class SetPlanStatusUseCase {
    constructor(
        private readonly plans: PlanRepository,
        private readonly clock: Clock,
    ) {}

    /** Idempotente: o estado já solicitado devolve a representação atual sem nova versão. */
    async execute(input: {
        id: string;
        version: number;
        status: ActiveStatus;
    }): Promise<PlanRecord> {
        const current = await this.plans.findById(input.id);
        if (!current) throw new ResourceNotFoundError();
        if (current.status === input.status) return current;

        const updated = await this.plans.update(
            input.id,
            input.version,
            { status: input.status },
            this.clock.now(),
        );
        return (
            updated ??
            failVersionedUpdate(async () =>
                Boolean(await this.plans.findById(input.id)),
            )
        );
    }
}
