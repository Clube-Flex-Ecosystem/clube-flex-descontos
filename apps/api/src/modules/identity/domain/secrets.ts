import { createHash, randomBytes } from 'node:crypto';

// Alfabeto Crockford: sem I, L, O e U, para reduzir erros de digitação.
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 16;

export function sha256Hex(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}

/** Código de acesso de 80 bits, exibido em quatro grupos: `ABCD-EFGH-JKMN-PQRS`. */
export function generateAccessCode(): string {
    const bytes = randomBytes(CODE_LENGTH);
    const chars = Array.from(
        bytes,
        (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length],
    );
    return (chars.join('').match(/.{4}/g) ?? []).join('-');
}

/** Aceita variações de caixa, separadores e caracteres ambíguos digitados pelo usuário. */
export function normalizeAccessCode(input: string): string {
    return input
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, '')
        .replace(/O/g, '0')
        .replace(/[IL]/g, '1');
}

export function hashAccessCode(input: string): string {
    return sha256Hex(`access-code:${normalizeAccessCode(input)}`);
}
