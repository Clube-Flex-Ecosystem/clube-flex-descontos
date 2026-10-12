import { baseUsername } from '@flex/contracts';

export { baseUsername };

/** Resolve colisões com sufixo numérico sequencial: `joao.silva`, `joao.silva.2`, ... */
export function generateUsername(
    fullName: string,
    isTaken: (candidate: string) => boolean,
): string {
    const base = baseUsername(fullName);
    if (!isTaken(base)) return base;
    for (let suffix = 2; ; suffix += 1) {
        const candidate = `${base}.${suffix}`;
        if (!isTaken(candidate)) return candidate;
    }
}
