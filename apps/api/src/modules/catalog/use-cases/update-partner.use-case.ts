import type { Clock } from '../../identity/services.types';
import { failVersionedUpdate } from '../domain/optimistic-concurrency';
import { assertPublishable } from '../domain/partner-publication';
import { resolveReferences } from '../domain/partner-references';
import { ResourceNotFoundError, VersionConflictError } from '../errors';
import type { CatalogUnitOfWork } from '../repositories/catalog-unit-of-work.types';
import type { PartnerData } from '../repositories/partner.repository';
import type { PartnerResult } from './create-partner.use-case';

export class UpdatePartnerUseCase {
  constructor(
    private readonly unitOfWork: CatalogUnitOfWork,
    private readonly clock: Clock,
  ) {}

  /**
   * Substitui o agregado completo em uma única transação. Um parceiro publicado precisa
   * continuar atendendo às condições de publicação (RN-002); caso contrário nada é salvo.
   */
  execute(input: {
    id: string;
    version: number;
    data: PartnerData;
  }): Promise<PartnerResult> {
    return this.unitOfWork.run(async (repositories) => {
      const existing = await repositories.partners.findById(input.id);
      if (!existing) throw new ResourceNotFoundError();
      if (existing.version !== input.version) throw new VersionConflictError();

      const references = await resolveReferences(
        repositories,
        input.data,
        existing,
      );
      if (existing.status === 'published') {
        assertPublishable(
          {
            name: input.data.name,
            description: input.data.description,
            usageInstructions: input.data.usageInstructions,
            categories: references.categories,
            contacts: input.data.contacts,
            benefits: input.data.benefits,
          },
          references.activePlanIds,
        );
      }

      const partner =
        (await repositories.partners.replace(
          input.id,
          input.version,
          input.data,
          this.clock.now(),
        )) ??
        (await failVersionedUpdate(async () =>
          Boolean(await repositories.partners.findById(input.id)),
        ));

      const duplicate = await repositories.partners.hasSimilarName(
        partner.name,
        partner.id,
      );
      return {
        partner,
        warnings: duplicate ? ['POSSIBLE_DUPLICATE_PARTNER'] : [],
      };
    });
  }
}
