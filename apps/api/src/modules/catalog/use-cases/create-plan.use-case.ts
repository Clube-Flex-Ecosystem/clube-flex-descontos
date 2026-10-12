import { slugify, uniqueSlug } from '../domain/slug';
import type {
  PlanRecord,
  PlanRepository,
} from '../repositories/plan.repository';
import type { Clock } from '../../identity/services.types';

export class CreatePlanUseCase {
  constructor(
    private readonly plans: PlanRepository,
    private readonly clock: Clock,
  ) {}

  /** O identificador público é gerado do nome quando não informado (RN-040). */
  async execute(input: { name: string; slug?: string }): Promise<PlanRecord> {
    const slug =
      input.slug ??
      (await uniqueSlug(slugify(input.name, 'plano'), (candidate) =>
        this.plans.slugExists(candidate),
      ));
    return this.plans.create({ name: input.name, slug }, this.clock.now());
  }
}
