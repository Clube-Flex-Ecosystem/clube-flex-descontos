/**
 * Nome da restrição de unicidade violada, quando o erro (ou sua causa) for um `23505` do
 * PostgreSQL. O Drizzle envolve o erro do driver em `cause`.
 */
export function uniqueViolationConstraint(error: unknown): string | undefined {
    let current: unknown = error;
    for (let depth = 0; depth < 4 && current; depth += 1) {
        const candidate = current as {
            code?: unknown;
            constraint?: unknown;
            cause?: unknown;
        };
        if (candidate.code === '23505') {
            return typeof candidate.constraint === 'string'
                ? candidate.constraint
                : 'unknown';
        }
        current = candidate.cause;
    }
    return undefined;
}
