import { CommercialConflictError } from '../commercial.errors';
import type { LeadSourceRepository } from '../repositories/lead-source.repository';

export class CreateLeadSourceUseCase {
  constructor(private readonly sources: LeadSourceRepository) {}
  async execute(input: { name: string; requiresReferral: boolean }) {
    try {
      const source = await this.sources.create(input);
      return { ...source, usageCount: 0 };
    } catch {
      throw new CommercialConflictError('DUPLICATE_RESOURCE');
    }
  }
}
