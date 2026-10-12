import axios from 'axios';
import {
    publicCategorySchema,
    publicPartnerSchema,
    publicPlanSchema,
} from '@flex/contracts';
import { API_URL } from '../../../shared/config/env';

const http = axios.create({ baseURL: `${API_URL}/v1/public`, timeout: 8000 });
export const listPlans = async () =>
    publicPlanSchema.array().parse((await http.get('/plans')).data);
export const listCategories = async (planId: string) =>
    publicCategorySchema
        .array()
        .parse((await http.get('/categories', { params: { planId } })).data);
export const listPartners = async (planId: string, categoryId?: string) =>
    publicPartnerSchema
        .array()
        .parse(
            (await http.get('/partners', { params: { planId, categoryId } }))
                .data,
        );
export const getPartner = async (slug: string, planId?: string) =>
    publicPartnerSchema.parse(
        (
            await http.get(`/partners/${encodeURIComponent(slug)}`, {
                params: { planId },
            })
        ).data,
    );

/**
 * Slugs de todos os parceiros publicamente visíveis. A API só lista parceiros
 * por plano; como o parceiro elegível possui benefício em ao menos um plano
 * ativo, a união das listagens por plano equivale ao conjunto indexável.
 */
export const listPublicPartnerSlugs = async () => {
    const plans = await listPlans();
    const lists = await Promise.all(plans.map((p) => listPartners(p.id)));
    return [...new Set(lists.flat().map((partner) => partner.slug))].sort();
};
