import { z } from 'zod';
import { partnerSchema, type Partner } from '@flex/contracts';
import { http } from '../../../shared/http/client';
import { ifMatch } from '../../../shared/http/versioning';
import type { PartnerRequestBody } from '../schemas/partner-form';

const partnersSchema = z.array(partnerSchema);

export async function listPartners(): Promise<Partner[]> {
    const response = await http.get('/v1/admin/partners');
    return partnersSchema.parse(response.data);
}

export async function getPartner(id: string): Promise<Partner> {
    const response = await http.get(`/v1/admin/partners/${id}`);
    return partnerSchema.parse(response.data);
}

export async function createPartner(
    body: PartnerRequestBody,
): Promise<Partner> {
    const response = await http.post('/v1/admin/partners', body);
    return partnerSchema.parse(response.data);
}

/** Substitui o agregado completo; omissões de itens existentes solicitam sua remoção. */
export async function replacePartner(input: {
    id: string;
    version: number;
    body: PartnerRequestBody;
}): Promise<Partner> {
    const response = await http.put(
        `/v1/admin/partners/${input.id}`,
        input.body,
        ifMatch(input.version),
    );
    return partnerSchema.parse(response.data);
}

export type PartnerCommand = 'publish' | 'deactivate' | 'move-to-draft';

export async function runPartnerCommand(input: {
    id: string;
    version: number;
    command: PartnerCommand;
}): Promise<Partner> {
    const response = await http.post(
        `/v1/admin/partners/${input.id}/${input.command}`,
        undefined,
        ifMatch(input.version),
    );
    return partnerSchema.parse(response.data);
}

export async function deletePartner(input: {
    id: string;
    version: number;
}): Promise<Partner> {
    const response = await http.delete(
        `/v1/admin/partners/${input.id}`,
        ifMatch(input.version),
    );
    return partnerSchema.parse(response.data);
}
