import { failVersionedUpdate } from '../domain/optimistic-concurrency';
import type {
  PlanRecord,
  PlanRepository,
} from '../repositories/plan.repository.types';
import type { Clock } from '../../identity/services.types';

export class UpdatePlanUseCase {
  constructor(
    private readonly plans: PlanRepository,
    private readonly clock: Clock,
  ) {}

  /** Renomear nunca altera o identificador público. */
  async execute(input: {
    id: string;
    version: number;
    name: string;
  }): Promise<PlanRecord> {
    const updated = await this.plans.update(
      input.id,
      input.version,
      { name: input.name },
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
