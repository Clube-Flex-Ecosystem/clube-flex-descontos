import type { AuditRepository } from '../../audit/repositories/audit.repository.types';
import type { AccessCodeRepository } from './access-code.repository.types';
import type { PermissionRepository } from './permission.repository.types';
import type { SessionRepository } from './session.repository.types';
import type { UserRepository } from './user.repository.types';

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
