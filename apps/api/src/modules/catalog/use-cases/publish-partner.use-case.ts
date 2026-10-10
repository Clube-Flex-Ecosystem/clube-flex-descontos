import type { Clock } from '../../identity/services.types';
import { failVersionedUpdate } from '../domain/optimistic-concurrency';
import { assertPublishable } from '../domain/partner-publication';
import { ResourceNotFoundError, VersionConflictError } from '../errors';
import type { CatalogUnitOfWork } from '../repositories/catalog-unit-of-work.types';
import type { PartnerRecord } from '../repositories/partner.repository.types';

export class PublishPartnerUseCase {
  constructor(
    private readonly unitOfWork: CatalogUnitOfWork,
    private readonly clock: Clock,
  ) {}

  /**
   * Publica um rascunho ou republica um parceiro desativado. Informa todas as pendências
   * de uma vez; um parceiro já publicado é devolvido sem efeitos.
   */
  execute(input: { id: string; version: number }): Promise<PartnerRecord> {
    return this.unitOfWork.run(async (repositories) => {
      const existing = await repositories.partners.findById(input.id);
      if (!existing) throw new ResourceNotFoundError();
      if (existing.status === 'published') return existing;
      if (existing.version !== input.version) throw new VersionConflictError();

      const plans = await repositories.plans.list();
      assertPublishable(
        existing,
        new Set(
          plans.filter((plan) => plan.status === 'active').map((p) => p.id),
        ),
      );

      return (
        (await repositories.partners.setStatus(
          input.id,
          input.version,
          'published',
          this.clock.now(),
        )) ??
        failVersionedUpdate(async () =>
          Boolean(await repositories.partners.findById(input.id)),
        )
      );
    });
  }
}
