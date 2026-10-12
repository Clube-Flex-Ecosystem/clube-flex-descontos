import type { AuditRepository } from '../../audit/repositories/audit.repository';
import type { AccessCodeRepository } from './access-code.repository';
import type { PermissionRepository } from './permission.repository';
import type { SessionRepository } from './session.repository';
import type { UserRepository } from './user.repository';

export interface TransactionalRepositories {
  users: UserRepository;
  permissions: PermissionRepository;
  sessions: SessionRepository;
  accessCodes: AccessCodeRepository;
  audit: AuditRepository;
}

/** Executa o trabalho em uma única transação; qualquer exceção desfaz todas as escritas. */
export interface UnitOfWork {
  run<T>(
    work: (repositories: TransactionalRepositories) => Promise<T>,
  ): Promise<T>;
}
