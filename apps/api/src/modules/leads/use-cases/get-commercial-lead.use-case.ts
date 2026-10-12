import type { Lead } from '@flex/contracts';
import type { CommercialRepository } from '../repositories/commercial.repository';
import { leadDetail, type CommercialActor } from '../domain/commercial-context';

export class GetCommercialLeadUseCase {
  constructor(private readonly leads: CommercialRepository) {}
  execute(actor: CommercialActor, id: string): Promise<Lead> {
    return leadDetail(this.leads, actor, id);
  }
}
