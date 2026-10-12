import type {
  PartnerRecord,
  PartnerRepository,
} from '../repositories/partner.repository';

export class ListPartnersUseCase {
  constructor(private readonly partners: PartnerRepository) {}

  execute(): Promise<PartnerRecord[]> {
    return this.partners.list();
  }
}
