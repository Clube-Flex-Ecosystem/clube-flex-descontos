import { CommercialConflictError } from '../commercial.errors';
import type { LeadSourceRepository } from '../repositories/lead-source.repository';
import { CommercialNotFoundError } from '../commercial.errors';

export class DeleteLeadSourceUseCase {
  constructor(private readonly sources: LeadSourceRepository) {}
  async execute(id: string, version: number) {
    const current = await this.sources.findById(id);
    if (!current) throw new CommercialNotFoundError();
    if (current.protected)
      throw new CommercialConflictError('PROTECTED_RESOURCE');
    const used =
      (await this.sources.list()).find((x) => x.id === id)?.usageCount ?? 0;
    if (used) throw new CommercialConflictError('PROTECTED_RESOURCE');
    const source = await this.sources.delete(id, version);
    if (!source) throw new CommercialConflictError();
    return { ...source, usageCount: 0, deleted: true };
  }
}
