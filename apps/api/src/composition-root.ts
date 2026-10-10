import type { Pool } from 'pg';
import { AccessCodeDelivery } from './modules/identity/access-code-delivery';
import type {
  ApplicationLogger,
  Clock,
  EmailSender,
  PasswordHasher,
} from './modules/identity/services.types';
import { AuthenticateUserUseCase } from './modules/identity/use-cases/authenticate-user.use-case';
import { BootstrapFirstAdministratorUseCase } from './modules/identity/use-cases/bootstrap-first-administrator.use-case';
import { ChangePasswordUseCase } from './modules/identity/use-cases/change-password.use-case';
import { LogoutUseCase } from './modules/identity/use-cases/logout.use-case';
import { RequestRecoveryUseCase } from './modules/identity/use-cases/request-recovery.use-case';
import { ResolveSessionUseCase } from './modules/identity/use-cases/resolve-session.use-case';
import { SetPasswordWithAccessCodeUseCase } from './modules/identity/use-cases/set-password-with-access-code.use-case';
import { createDatabase } from './infrastructure/database/drizzle/client';
import {
  DrizzleUnitOfWork,
  createRepositories,
} from './infrastructure/database/drizzle/drizzle-unit-of-work';

export interface CompositionDependencies {
  pool: Pool;
  hasher: PasswordHasher;
  emailSender: EmailSender;
  clock: Clock;
  logger: ApplicationLogger;
  dashboardOrigin: string;
}

/** Ponto único de composição manual das dependências (ADR-0006), sem container de DI. */
export function createCompositionRoot(deps: CompositionDependencies) {
  const db = createDatabase(deps.pool);
  const unitOfWork = new DrizzleUnitOfWork(db);
  const { users, sessions, permissions } = createRepositories(db);
  const delivery = new AccessCodeDelivery(
    deps.emailSender,
    deps.dashboardOrigin,
  );

  return {
    identity: {
      resolveSession: new ResolveSessionUseCase(
        sessions,
        users,
        permissions,
        deps.clock,
      ),
      authenticateUser: new AuthenticateUserUseCase(
        users,
        sessions,
        deps.hasher,
        deps.clock,
      ),
      logout: new LogoutUseCase(sessions, deps.clock),
      setPasswordWithAccessCode: new SetPasswordWithAccessCodeUseCase(
        unitOfWork,
        deps.hasher,
        deps.clock,
      ),
      requestRecovery: new RequestRecoveryUseCase(
        unitOfWork,
        delivery,
        deps.clock,
        deps.logger,
      ),
      changePassword: new ChangePasswordUseCase(
        unitOfWork,
        deps.hasher,
        deps.clock,
      ),
      bootstrapFirstAdministrator: new BootstrapFirstAdministratorUseCase(
        unitOfWork,
        delivery,
        deps.clock,
      ),
    },
  };
}

export type CompositionRoot = ReturnType<typeof createCompositionRoot>;
