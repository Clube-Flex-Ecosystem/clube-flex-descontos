import {
  ProtectedResourceError,
  ResourceNotFoundError,
  VersionConflictError,
} from '../errors';
import type {
  PartnerRecord,
  PartnerRepository,
} from '../repositories/partner.repository.types';

export class DeletePartnerUseCase {
  constructor(private readonly partners: PartnerRepository) {}

  /**
   * Somente um rascunho que nunca foi publicado pode ser excluído; qualquer outro registro
   * possui histórico público e deve ser desativado. Retorna a última representação.
   */
  async execute(input: {
    id: string;
    version: number;
  }): Promise<PartnerRecord> {
    const existing = await this.partners.findById(input.id);
    if (!existing) throw new ResourceNotFoundError();
    if (existing.version !== input.version) throw new VersionConflictError();
    if (existing.status !== 'draft' || existing.firstPublishedAt) {
      throw new ProtectedResourceError(
        'Parceiros que já foram publicados são preservados; desative o registro.',
      );
    }

    if (!(await this.partners.delete(input.id, input.version))) {
      throw new VersionConflictError();
    }
    return existing;
  }
}
