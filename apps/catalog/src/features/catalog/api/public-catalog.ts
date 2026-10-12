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
