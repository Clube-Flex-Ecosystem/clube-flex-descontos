import type { APIRoute } from 'astro';
import type { HealthStatus } from '@flex/contracts';

export const prerender = false;

// Verificação de processo ativo: não depende da API.
export const GET: APIRoute = () => {
    const body: HealthStatus = { status: 'ok' };
    return Response.json(body);
};
