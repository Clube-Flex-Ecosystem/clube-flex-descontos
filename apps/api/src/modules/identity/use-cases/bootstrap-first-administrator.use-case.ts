import { permissions } from '@flex/contracts';
import { issueAccessCode } from '../access-code-issuer';
import type { AccessCodeDelivery } from '../access-code-delivery';
import { generateUsername } from '../domain/username';
import { BootstrapRefusedError } from '../errors';
import type { UserAccount } from '../repositories/user.repository.types';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { Clock } from '../services.types';

export interface BootstrapResult {
  user: UserAccount;
  /** Presente somente quando o código precisa ser entregue fora do sistema. */
  accessCode?: string;
  deliveryFailed: boolean;
}

const BOOTSTRAP_ACTOR = 'system/bootstrap';

/**
 * Cria o primeiro administrador, com todas as permissões existentes e código de ativação.
 * Nunca recebe nem define a senha e recusa a execução quando já existe qualquer usuário.
 */
export class BootstrapFirstAdministratorUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly delivery: AccessCodeDelivery,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    fullName: string;
    email?: string;
  }): Promise<BootstrapResult> {
    const now = this.clock.now();

    const { user, code } = await this.unitOfWork.run(
      async ({ users, permissions: grants, accessCodes, audit }) => {
        await users.lockUserCreation();
        if ((await users.count()) > 0) throw new BootstrapRefusedError();

        // A base está vazia, portanto o nome de usuário não possui colisões a resolver.
        const user = await users.create(
          {
            fullName: input.fullName,
            username: generateUsername(input.fullName, () => false),
            ...(input.email ? { email: input.email } : {}),
          },
          now,
        );
        await grants.grant(user.id, permissions, null, now);
        const code = await issueAccessCode(
          accessCodes,
          user.id,
          'activation',
          now,
        );

        const target = {
          targetType: 'user',
          targetId: user.id,
          targetLabel: user.username,
        };
        const actor = {
          actorUserId: null,
          actorLabel: BOOTSTRAP_ACTOR,
          occurredAt: now,
        };
        await audit.record({
          ...actor,
          ...target,
          action: 'user.created',
          after: {
            fullName: user.fullName,
            username: user.username,
            ...(user.email ? { email: user.email } : {}),
          },
        });
        await audit.record({
          ...actor,
          ...target,
          action: 'user.permissions.updated',
          before: { permissions: [] },
          after: { permissions: [...permissions] },
        });
        // O valor do código nunca integra a auditoria.
        await audit.record({
          ...actor,
          ...target,
          action: 'user.access-code.issued',
          after: { purpose: 'activation' },
        });
        return { user, code };
      },
    );

    const delivery = await this.delivery.deliver({
      fullName: user.fullName,
      ...(user.email ? { email: user.email } : {}),
      purpose: 'activation',
      code,
    });
    return delivery.channel === 'email'
      ? { user, deliveryFailed: false }
      : {
          user,
          accessCode: code,
          deliveryFailed: Boolean(user.email),
        };
  }
}
