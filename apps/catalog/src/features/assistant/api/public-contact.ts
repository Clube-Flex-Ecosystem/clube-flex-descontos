import axios from 'axios';
import {
    contactConsentSchema,
    publicContactResponseSchema,
    type PublicContactRequest,
} from '@flex/contracts';
import { API_URL } from '../../../shared/config/env';

const http = axios.create({ baseURL: `${API_URL}/v1/public`, timeout: 8000 });
export const getContactConsent = async () =>
    contactConsentSchema.parse((await http.get('/contact-consent')).data);
export const sendContactRequest = async (input: PublicContactRequest) =>
    publicContactResponseSchema.parse(
        (await http.post('/contact-requests', input)).data,
    );
