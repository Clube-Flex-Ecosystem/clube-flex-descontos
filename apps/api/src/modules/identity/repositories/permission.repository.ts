import type { Permission } from '@flex/contracts';

export interface PermissionRepository {
    listForUser(userId: string): Promise<Permission[]>;
    /** Concessões de todas as contas, agrupadas por usuário. */
    listForAll(): Promise<Map<string, Permission[]>>;
    /** `grantedBy` é nulo quando a concessão parte de um ator técnico. */
    grant(
        userId: string,
        permissions: readonly Permission[],
        grantedBy: string | null,
        now: Date,
    ): Promise<void>;
    /** Mantém somente as permissões informadas; as já concedidas preservam autor e data. */
    replace(
        userId: string,
        permissions: readonly Permission[],
        grantedBy: string,
        now: Date,
    ): Promise<void>;
}
