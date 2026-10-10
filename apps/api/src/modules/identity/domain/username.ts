/** Normaliza o nome completo conforme RN-019: minúsculas, sem acentos, espaços como pontos. */
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
