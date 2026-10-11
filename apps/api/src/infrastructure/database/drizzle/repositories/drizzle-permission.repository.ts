import { and, eq, notInArray } from 'drizzle-orm';
import { permissionSchema, type Permission } from '@flex/contracts';
import type { PermissionRepository } from '../../../../modules/identity/repositories/permission.repository.types';
import type { DatabaseExecutor } from '../client';
import { userPermissions } from '../schema';

// Concessões de identificadores que deixaram de existir no catálogo são ignoradas.
function knownPermission(value: string): Permission[] {
  const parsed = permissionSchema.safeParse(value);
  return parsed.success ? [parsed.data] : [];
}

export class DrizzlePermissionRepository implements PermissionRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async listForUser(userId: string): Promise<Permission[]> {
    const rows = await this.db
      .select({ permission: userPermissions.permission })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));
    return rows.flatMap((row) => knownPermission(row.permission));
  }

  async listForAll(): Promise<Map<string, Permission[]>> {
    const rows = await this.db
      .select({
        userId: userPermissions.userId,
        permission: userPermissions.permission,
      })
      .from(userPermissions);
    const grouped = new Map<string, Permission[]>();
    for (const row of rows) {
      const known = knownPermission(row.permission);
      if (known.length === 0) continue;
      grouped.set(row.userId, [...(grouped.get(row.userId) ?? []), ...known]);
    }
    return grouped;
  }

  async grant(
    userId: string,
    permissions: readonly Permission[],
    grantedBy: string | null,
    now: Date,
  ): Promise<void> {
    if (permissions.length === 0) return;
    await this.db
      .insert(userPermissions)
      .values(
        permissions.map((permission) => ({
          userId,
          permission,
          grantedAt: now,
          grantedBy,
        })),
      )
      .onConflictDoNothing();
  }

  async replace(
    userId: string,
    permissions: readonly Permission[],
    grantedBy: string,
    now: Date,
  ): Promise<void> {
    const kept = [...permissions];
    await this.db
      .delete(userPermissions)
      .where(
        kept.length > 0
          ? and(
              eq(userPermissions.userId, userId),
              notInArray(userPermissions.permission, kept),
            )
          : eq(userPermissions.userId, userId),
      );
    await this.grant(userId, kept, grantedBy, now);
  }
}
