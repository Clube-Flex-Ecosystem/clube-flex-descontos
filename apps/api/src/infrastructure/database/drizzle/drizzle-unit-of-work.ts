import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../../modules/identity/repositories/unit-of-work.types';
import type { Database, DatabaseExecutor } from './client';
import { DrizzleAccessCodeRepository } from './repositories/drizzle-access-code.repository';
import { DrizzleAuditRepository } from './repositories/drizzle-audit.repository';
import { DrizzlePermissionRepository } from './repositories/drizzle-permission.repository';
import { DrizzleSessionRepository } from './repositories/drizzle-session.repository';
import { DrizzleUserRepository } from './repositories/drizzle-user.repository';

export function createRepositories(
  executor: DatabaseExecutor,
): TransactionalRepositories {
  return {
    users: new DrizzleUserRepository(executor),
    permissions: new DrizzlePermissionRepository(executor),
    sessions: new DrizzleSessionRepository(executor),
    accessCodes: new DrizzleAccessCodeRepository(executor),
    audit: new DrizzleAuditRepository(executor),
  };
}

export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Database) {}

  run<T>(
    work: (repositories: TransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction((tx) => work(createRepositories(tx)));
  }
}
