import type { APIRoute } from 'astro';

// Gerado no build com o `site` configurado. Rastreamento liberado (inclusive
// CSS e JS); páginas sem valor de busca usam `noindex` na própria página,
// que só funciona se o rastreador puder acessá-las.
export const prerender = true;

export const GET: APIRoute = ({ site }) =>
    new Response(
        [
            'User-agent: *',
            'Allow: /',
            'Disallow: /health',
            '',
            `Sitemap: ${new URL('/sitemap.xml', site).href}`,
            '',
        ].join('\n'),
        { headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
