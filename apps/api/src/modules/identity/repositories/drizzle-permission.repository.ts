import { and, eq, notInArray } from 'drizzle-orm';
import { permissionSchema, type Permission } from '@flex/contracts';
import type { PermissionRepository } from './permission.repository';
import {
    db,
    type DatabaseExecutor,
} from '../../../infrastructure/database/drizzle/client';
import { userPermissions } from '../../../infrastructure/database/drizzle/schema';

// Concessões de identificadores que deixaram de existir no catálogo são ignoradas.
function knownPermission(value: string): Permission[] {
    const parsed = permissionSchema.safeParse(value);
    return parsed.success ? [parsed.data] : [];
}

export class DrizzlePermissionRepository implements PermissionRepository {
    private transaction?: DatabaseExecutor;

    private get db(): DatabaseExecutor {
        return this.transaction ?? db;
    }

    /** Escopo interno usado somente por Unit of Work. */
    withTransaction(transaction: DatabaseExecutor): this {
        this.transaction = transaction;
        return this;
    }

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
            grouped.set(row.userId, [
                ...(grouped.get(row.userId) ?? []),
                ...known,
            ]);
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
