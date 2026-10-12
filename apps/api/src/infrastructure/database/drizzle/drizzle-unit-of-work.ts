import type {
    TransactionalRepositories,
    UnitOfWork,
} from '../../../modules/identity/repositories/unit-of-work.types';
import { db, type DatabaseExecutor } from './client';
import { DrizzleAccessCodeRepository } from '../../../modules/identity/repositories/drizzle-access-code.repository';
import { DrizzleAuditRepository } from '../../../modules/audit/repositories/drizzle-audit.repository';
import { DrizzlePermissionRepository } from '../../../modules/identity/repositories/drizzle-permission.repository';
import { DrizzleUserRepository } from '../../../modules/identity/repositories/drizzle-user.repository';

export function createRepositories(
    transaction?: DatabaseExecutor,
): TransactionalRepositories {
    return {
        users: transaction
            ? new DrizzleUserRepository().withTransaction(transaction)
            : new DrizzleUserRepository(),
        permissions: transaction
            ? new DrizzlePermissionRepository().withTransaction(transaction)
            : new DrizzlePermissionRepository(),
        accessCodes: transaction
            ? new DrizzleAccessCodeRepository().withTransaction(transaction)
            : new DrizzleAccessCodeRepository(),
        audit: transaction
            ? new DrizzleAuditRepository().withTransaction(transaction)
            : new DrizzleAuditRepository(),
    };
}

export class DrizzleUnitOfWork implements UnitOfWork {
    run<T>(
        work: (repositories: TransactionalRepositories) => Promise<T>,
    ): Promise<T> {
        return db.transaction((tx) => work(createRepositories(tx)));
    }
}
