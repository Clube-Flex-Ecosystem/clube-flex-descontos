import { and, eq, isNull, sql } from 'drizzle-orm';
import type {
  AccessCodePurpose,
  AccessCodeRecord,
  AccessCodeRepository,
  NewAccessCode,
} from './access-code.repository';
import {
  db,
  type DatabaseExecutor,
} from '../../../infrastructure/database/drizzle/client';
import { accessCodes } from '../../../infrastructure/database/drizzle/schema';

export class DrizzleAccessCodeRepository implements AccessCodeRepository {
  private transaction?: DatabaseExecutor;

  private get db(): DatabaseExecutor {
    return this.transaction ?? db;
  }

  /** Escopo interno usado somente por Unit of Work. */
  withTransaction(transaction: DatabaseExecutor): this {
    this.transaction = transaction;
    return this;
  }

  async create(code: NewAccessCode): Promise<void> {
    await this.db.insert(accessCodes).values({
      userId: code.userId,
      purpose: code.purpose,
      codeHash: code.codeHash,
      createdAt: code.now,
      expiresAt: code.expiresAt,
    });
  }

  async invalidateOpen(
    userId: string,
    purpose: AccessCodePurpose,
    now: Date,
  ): Promise<void> {
    await this.db
      .update(accessCodes)
      .set({ invalidatedAt: now })
      .where(
        and(
          eq(accessCodes.userId, userId),
          eq(accessCodes.purpose, purpose),
          isNull(accessCodes.usedAt),
          isNull(accessCodes.invalidatedAt),
        ),
      );
  }

  async findByCodeHash(codeHash: string): Promise<AccessCodeRecord | null> {
    const [row] = await this.db
      .select()
      .from(accessCodes)
      .where(eq(accessCodes.codeHash, codeHash));
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      purpose: row.purpose,
      expiresAt: row.expiresAt,
      failedAttempts: row.failedAttempts,
      ...(row.usedAt ? { usedAt: row.usedAt } : {}),
      ...(row.invalidatedAt ? { invalidatedAt: row.invalidatedAt } : {}),
    };
  }

  async registerFailedAttempt(codeId: string): Promise<void> {
    await this.db
      .update(accessCodes)
      .set({ failedAttempts: sql`${accessCodes.failedAttempts} + 1` })
      .where(eq(accessCodes.id, codeId));
  }

  async markUsed(codeId: string, now: Date): Promise<boolean> {
    const updated = await this.db
      .update(accessCodes)
      .set({ usedAt: now })
      .where(
        and(
          eq(accessCodes.id, codeId),
          isNull(accessCodes.usedAt),
          isNull(accessCodes.invalidatedAt),
        ),
      )
      .returning({ id: accessCodes.id });
    return updated.length === 1;
  }
}
