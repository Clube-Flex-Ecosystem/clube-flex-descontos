import { SLUG_MAX, SLUG_MIN } from '@flex/contracts';

/** Identificador público derivado do nome: minúsculas, sem acentos e separado por hífens. */
export function slugify(name: string, fallback: string): string {
  const base = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX - 6)
    .replace(/-+$/g, '');
  if (base.length >= SLUG_MIN) return base;
  return base ? `${fallback}-${base}` : fallback;
}

/** Acrescenta um sufixo numérico sequencial enquanto o identificador já existir. */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let candidate = base;
  for (let suffix = 2; await exists(candidate); suffix += 1) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
