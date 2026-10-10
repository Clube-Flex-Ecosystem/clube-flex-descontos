import type { Permission } from '@flex/contracts';

export interface PermissionRepository {
  listForUser(userId: string): Promise<Permission[]>;
  /** `grantedBy` é nulo quando a concessão parte de um ator técnico. */
  grant(
    userId: string,
    permissions: readonly Permission[],
    grantedBy: string | null,
    now: Date,
  ): Promise<void>;
}
