import type {
  PartnerRecord,
  PartnerRepository,
} from '../repositories/partner.repository.types';

export class ListPartnersUseCase {
  constructor(private readonly partners: PartnerRepository) {}

  execute(): Promise<PartnerRecord[]> {
    return this.partners.list();
  }
}
