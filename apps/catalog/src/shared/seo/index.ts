const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Reduz o texto ao limite de caracteres, cortando em fim de palavra. */
export function truncate(text: string, max = 155): string {
    const clean = collapse(text);
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, '')}…`;
}

export const escapeXml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

/** Serializa JSON-LD sem permitir o fechamento antecipado do `<script>`. */
export const serializeJsonLd = (data: unknown) =>
    JSON.stringify(data).replace(/</g, '\u003c');
