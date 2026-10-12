export const SITE_NAME = 'Clube Flex';
export const SITE_LOCALE = 'pt_BR';

/** Imagem Open Graph institucional, fallback das páginas sem imagem própria. */
export const DEFAULT_OG_IMAGE = {
    path: '/open-graph.jpg',
    width: 1200,
    height: 630,
    alt: 'Clube Flex: conheça nossos parceiros e descubra benefícios e vantagens.',
};

/** Dados institucionais exibidos no rodapé, reaproveitados no JSON-LD. */
export const ORGANIZATION = {
    name: SITE_NAME,
    telephone: '+552127029080',
    email: 'comercial@flexcard.org.br',
    address: {
        streetAddress: 'Rua Laureano Rosa 100',
        addressLocality: 'São Gonçalo',
        addressRegion: 'RJ',
        addressCountry: 'BR',
    },
} as const;
