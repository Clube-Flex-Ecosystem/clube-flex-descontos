import type { Clock } from '../../identity/services.types';
import { failVersionedUpdate } from '../domain/optimistic-concurrency';
import { InvalidResourceStateError, ResourceNotFoundError } from '../errors';
import type {
  PartnerRecord,
  PartnerRepository,
} from '../repositories/partner.repository.types';

export class MovePartnerToDraftUseCase {
  constructor(
    private readonly partners: PartnerRepository,
    private readonly clock: Clock,
  ) {}

  /** Somente um parceiro desativado retorna a rascunho. */
  async execute(input: {
    id: string;
    version: number;
  }): Promise<PartnerRecord> {
    const existing = await this.partners.findById(input.id);
    if (!existing) throw new ResourceNotFoundError();
    if (existing.status === 'draft') return existing;
    if (existing.status === 'published') {
      throw new InvalidResourceStateError(
        'Desative o parceiro antes de enviá-lo para rascunho.',
      );
    }

    return (
      (await this.partners.setStatus(
        input.id,
        input.version,
        'draft',
        this.clock.now(),
      )) ??
      failVersionedUpdate(async () =>
        Boolean(await this.partners.findById(input.id)),
      )
    );
  }
}
