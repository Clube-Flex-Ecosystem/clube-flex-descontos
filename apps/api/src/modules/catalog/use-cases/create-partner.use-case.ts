import type { PartnerWarning } from '@flex/contracts';
import type { Clock } from '../../identity/services.types';
import { resolveReferences } from '../domain/partner-references';
import { slugify, uniqueSlug } from '../domain/slug';
import type { CatalogUnitOfWork } from '../repositories/catalog-unit-of-work.types';
import type {
  PartnerData,
  PartnerRecord,
} from '../repositories/partner.repository';

export interface PartnerResult {
  partner: PartnerRecord;
  warnings: PartnerWarning[];
}

export class CreatePartnerUseCase {
  constructor(
    private readonly unitOfWork: CatalogUnitOfWork,
    private readonly clock: Clock,
  ) {}

  /** O parceiro nasce como rascunho; o identificador público é gerado do nome se omitido. */
  execute(
    input: Omit<PartnerData, 'slug'> & { slug?: string },
  ): Promise<PartnerResult> {
    return this.unitOfWork.run(async (repositories) => {
      await resolveReferences(repositories, input);

      const slug =
        input.slug ??
        (await uniqueSlug(slugify(input.name, 'parceiro'), (candidate) =>
          repositories.partners.slugExists(candidate),
        ));
      const partner = await repositories.partners.create(
        { ...input, slug },
        this.clock.now(),
      );

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
