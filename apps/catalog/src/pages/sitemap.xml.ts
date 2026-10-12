import type { APIRoute } from 'astro';
import { listPublicPartnerSlugs } from '../features/catalog/api/public-catalog';
import { escapeXml } from '../shared/seo';

export const prerender = false;

// Gerado a cada requisição a partir da API pública: parceiros publicados ou
// despublicados refletem-se sem novo build. Apenas rotas públicas indexáveis.
export const GET: APIRoute = async ({ site }) => {
    let slugs: string[];
    try {
        slugs = await listPublicPartnerSlugs();
    } catch {
        // Nunca publicar um sitemap parcial: o rastreador tenta novamente depois.
        return new Response('Sitemap temporariamente indisponível.', {
            status: 503,
            headers: { 'retry-after': '300', 'cache-control': 'no-store' },
        });
    }
    const paths = [
        '/',
        ...slugs.map((slug) => `/parceiros/${encodeURIComponent(slug)}`),
    ];
    const urls = [...new Set(paths.map((p) => new URL(p, site).href))];
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join('\n')}
</urlset>
`;
    return new Response(body, {
        headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=900',
        },
    });
};
