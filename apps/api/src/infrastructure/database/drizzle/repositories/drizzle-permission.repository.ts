import { eq } from 'drizzle-orm';
import { permissionSchema, type Permission } from '@flex/contracts';
import type { PermissionRepository } from '../../../../modules/identity/repositories/permission.repository.types';
import type { DatabaseExecutor } from '../client';
import { userPermissions } from '../schema';

export class DrizzlePermissionRepository implements PermissionRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async listForUser(userId: string): Promise<Permission[]> {
    const rows = await this.db
      .select({ permission: userPermissions.permission })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));
    // Concessões de identificadores que deixaram de existir no catálogo são ignoradas.
    return rows.flatMap((row) => {
      const parsed = permissionSchema.safeParse(row.permission);
      return parsed.success ? [parsed.data] : [];
    });
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
}
