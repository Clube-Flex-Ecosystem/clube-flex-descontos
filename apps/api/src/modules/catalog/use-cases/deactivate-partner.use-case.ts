import type { Clock } from '../../identity/services.types';
import { failVersionedUpdate } from '../domain/optimistic-concurrency';
import { InvalidResourceStateError, ResourceNotFoundError } from '../errors';
import type {
    PartnerRecord,
    PartnerRepository,
} from '../repositories/partner.repository';

export class DeactivatePartnerUseCase {
    constructor(
        private readonly partners: PartnerRepository,
        private readonly clock: Clock,
    ) {}

    /**
     * Retira um parceiro publicado do catálogo preservando todas as associações (RN-005).
     * Um rascunho nunca esteve no catálogo e não pode ser desativado.
     */
    async execute(input: {
        id: string;
        version: number;
    }): Promise<PartnerRecord> {
        const existing = await this.partners.findById(input.id);
        if (!existing) throw new ResourceNotFoundError();
        if (existing.status === 'inactive') return existing;
        if (existing.status === 'draft') {
            throw new InvalidResourceStateError(
                'Somente um parceiro publicado pode ser desativado.',
            );
        }

        return (
            (await this.partners.setStatus(
                input.id,
                input.version,
                'inactive',
                this.clock.now(),
            )) ??
            failVersionedUpdate(async () =>
                Boolean(await this.partners.findById(input.id)),
            )
        );
    }
}
