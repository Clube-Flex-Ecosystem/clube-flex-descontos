import { count, eq, sql } from 'drizzle-orm';
import type {
  NewUser,
  UserAccount,
  UserRepository,
} from '../../../../modules/identity/repositories/user.repository.types';
import type { DatabaseExecutor } from '../client';
import { users } from '../schema';

// Identificador fixo da trava que serializa a criação do primeiro usuário.
const USER_CREATION_LOCK = 7_301_001;

type UserRow = typeof users.$inferSelect;

function toAccount(row: UserRow): UserAccount {
  return {
    id: row.id,
    fullName: row.fullName,
    username: row.username,
    status: row.status,
    ...(row.email ? { email: row.email } : {}),
    ...(row.passwordHash ? { passwordHash: row.passwordHash } : {}),
  };
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async findById(id: string): Promise<UserAccount | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row ? toAccount(row) : null;
  }

  async findByUsername(username: string): Promise<UserAccount | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return row ? toAccount(row) : null;
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
  ): Promise<void> {
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: now })
      .where(eq(users.id, userId));
  }

  async lockUserCreation(): Promise<void> {
    await this.db.execute(
      sql`select pg_advisory_xact_lock(${USER_CREATION_LOCK})`,
    );
  }
}
