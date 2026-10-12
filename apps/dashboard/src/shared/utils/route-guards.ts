import { redirect } from '@tanstack/react-router';
import type { Permission, SessionResponse } from '@flex/contracts';

/**
 * Evita abrir uma tela sem a permissão de visualização. É conveniência de navegação: a
 * API continua sendo a autoridade e recusa a operação de qualquer forma.
 */
export function requirePermission(
    session: SessionResponse,
    permission: Permission,
): void {
    if (!session.permissions.includes(permission)) throw redirect({ to: '/' });
}

export function requireAnyPermission(
    session: SessionResponse,
    required: readonly Permission[],
): void {
    if (
        !required.some((permission) => session.permissions.includes(permission))
    )
        throw redirect({ to: '/' });
}
