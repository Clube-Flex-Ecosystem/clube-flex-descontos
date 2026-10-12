/**
 * Base do nome de usuário gerado a partir do nome completo (RN-019): minúsculas, sem
 * acentos nem caracteres especiais, espaços substituídos por pontos. O sufixo numérico de
 * colisão é resolvido somente pelo servidor.
 */
export function baseUsername(fullName: string): string {
    const base = fullName
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '.');
    return base || 'usuario';
}
