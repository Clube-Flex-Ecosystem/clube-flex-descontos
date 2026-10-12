import { ResourceNotFoundError } from '../errors';
import type {
    PartnerRecord,
    PartnerRepository,
} from '../repositories/partner.repository';

export class GetPartnerUseCase {
    constructor(private readonly partners: PartnerRepository) {}

    async execute(input: { id: string }): Promise<PartnerRecord> {
        const partner = await this.partners.findById(input.id);
        if (!partner) throw new ResourceNotFoundError();
        return partner;
    }
}
