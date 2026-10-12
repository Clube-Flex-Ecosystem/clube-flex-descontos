import { and, asc, count, eq, like, sql } from 'drizzle-orm';
import { administratorPermissions } from '@flex/contracts';
import { UsernameTakenError } from '../errors';
import type {
    NewUser,
    UserAccount,
    UserProfile,
    UserRepository,
} from './user.repository';
import {
    db,
    type DatabaseExecutor,
} from '../../../infrastructure/database/drizzle/client';
import { users } from '../../../infrastructure/database/drizzle/schema';
import { uniqueViolationConstraint } from '../../../infrastructure/database/drizzle/unique-violation';

// Identificadores fixos das travas que serializam operações sobre o conjunto de contas.
const USER_CREATION_LOCK = 7_301_001;
const ADMINISTRATION_LOCK = 7_301_002;

type UserRow = typeof users.$inferSelect;

function toAccount(row: UserRow): UserAccount {
    return {
        id: row.id,
        fullName: row.fullName,
        username: row.username,
        status: row.status,
        passwordChangeRequired: row.passwordChangeRequired,
        authVersion: row.authVersion,
        version: row.version,
        ...(row.email ? { email: row.email } : {}),
        ...(row.passwordHash ? { passwordHash: row.passwordHash } : {}),
    };
}

export class DrizzleUserRepository implements UserRepository {
    private transaction?: DatabaseExecutor;

    private get db(): DatabaseExecutor {
        return this.transaction ?? db;
    }

    /** Escopo interno usado somente por Unit of Work. */
    withTransaction(transaction: DatabaseExecutor): this {
        this.transaction = transaction;
        return this;
    }

    async findById(id: string): Promise<UserAccount | null> {
        const [row] = await this.db
            .select()
            .from(users)
            .where(eq(users.id, id));
        return row ? toAccount(row) : null;
    }

    async findByUsername(username: string): Promise<UserAccount | null> {
        const [row] = await this.db
            .select()
            .from(users)
            .where(eq(users.username, username));
        return row ? toAccount(row) : null;
    }

    async list(): Promise<UserAccount[]> {
        const rows = await this.db
            .select()
            .from(users)
            .orderBy(asc(users.fullName), asc(users.username));
        return rows.map(toAccount);
    }

    async count(): Promise<number> {
        const [row] = await this.db.select({ total: count() }).from(users);
        return row?.total ?? 0;
    }

    async usernameExists(username: string): Promise<boolean> {
        const [row] = await this.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, username));
        return Boolean(row);
    }

    async usernamesStartingWith(base: string): Promise<string[]> {
        // A base contém apenas letras minúsculas, dígitos e pontos, sem curingas de LIKE.
        const rows = await this.db
            .select({ username: users.username })
            .from(users)
            .where(like(users.username, `${base}%`));
        return rows.map((row) => row.username);
    }

    async create(user: NewUser, now: Date): Promise<UserAccount> {
        const [row] = await this.db
            .insert(users)
            .values({
                fullName: user.fullName,
                username: user.username,
                email: user.email ?? null,
                createdAt: now,
                updatedAt: now,
            })
            .returning();
        if (!row) throw new Error('Falha ao criar o usuário');
        return toAccount(row);
    }

    async setPasswordHash(
        userId: string,
        passwordHash: string,
        now: Date,
    ): Promise<UserAccount> {
        const [row] = await this.db
            .update(users)
            .set({
                passwordHash,
                passwordChangeRequired: false,
                authVersion: sql`${users.authVersion} + 1`,
                updatedAt: now,
            })
            .where(eq(users.id, userId))
            .returning();
        if (!row) throw new Error('Usuário não encontrado ao definir senha');
        return toAccount(row);
    }

    async updateProfile(
        userId: string,
        expectedVersion: number,
        profile: UserProfile,
        now: Date,
    ): Promise<UserAccount | null> {
        try {
            const [row] = await this.db
                .update(users)
                .set({
                    fullName: profile.fullName,
                    username: profile.username,
                    email: profile.email ?? null,
                    version: expectedVersion + 1,
                    updatedAt: now,
                })
                .where(
                    and(
                        eq(users.id, userId),
                        eq(users.version, expectedVersion),
                    ),
                )
                .returning();
            return row ? toAccount(row) : null;
        } catch (error) {
            // A restrição também decide a corrida entre duas edições do mesmo nome.
            if (uniqueViolationConstraint(error))
                throw new UsernameTakenError();
            throw error;
        }
    }

    async setStatus(
        userId: string,
        expectedVersion: number,
        status: 'active' | 'inactive',
        now: Date,
    ): Promise<UserAccount | null> {
        const [row] = await this.db
            .update(users)
            .set({
                status,
                version: expectedVersion + 1,
                authVersion: sql`${users.authVersion} + 1`,
                updatedAt: now,
            })
            .where(
                and(eq(users.id, userId), eq(users.version, expectedVersion)),
            )
            .returning();
        return row ? toAccount(row) : null;
    }

    async touch(
        userId: string,
        expectedVersion: number,
        now: Date,
    ): Promise<UserAccount | null> {
        const [row] = await this.db
            .update(users)
            .set({ version: expectedVersion + 1, updatedAt: now })
            .where(
                and(eq(users.id, userId), eq(users.version, expectedVersion)),
            )
            .returning();
        return row ? toAccount(row) : null;
    }

    async setPasswordChangeRequired(
        userId: string,
        required: boolean,
        now: Date,
    ): Promise<void> {
        await this.db
            .update(users)
            .set({ passwordChangeRequired: required, updatedAt: now })
            .where(eq(users.id, userId));
    }

    async countOtherAdministrators(excludingUserId: string): Promise<number> {
        const required = sql.join(
            administratorPermissions.map((permission) => sql`${permission}`),
            sql`, `,
        );
        const result = await this.db.execute<{ total: number }>(sql`
      select count(*)::int as total
      from users u
      where u.status = 'active'
        and u.password_hash is not null
        and u.id <> ${excludingUserId}
        and (
          select count(distinct p.permission)
          from user_permissions p
          where p.user_id = u.id and p.permission in (${required})
        ) = ${administratorPermissions.length}
    `);
        return result.rows[0]?.total ?? 0;
    }

    async lockAdministration(): Promise<void> {
        await this.db.execute(
            sql`select pg_advisory_xact_lock(${ADMINISTRATION_LOCK})`,
        );
    }

    async lockUserCreation(): Promise<void> {
        await this.db.execute(
            sql`select pg_advisory_xact_lock(${USER_CREATION_LOCK})`,
        );
    }
}
