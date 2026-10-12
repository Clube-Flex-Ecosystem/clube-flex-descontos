import type { AccessCodeDelivery } from '../access-code-delivery';
import { issueAccessCode } from '../access-code-issuer';
import type { AdminActor, UserWithAccessCode } from '../admin-user.types';
import { ACCESS_CODE_TTL_MS } from '../constants';
import { InvalidUserStateError, UserNotFoundError } from '../errors';
import type { AccessCodePurpose } from '../repositories/access-code.repository';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { Clock } from '../services.types';

/**
 * Emite um código de ativação ou recuperação (UC-023, A4). Uma recuperação administrativa
 * marca a conta como `passwordChangeRequired`: a senha anterior deixa de permitir o acesso
 * até que a pessoa defina a nova com o código (CA-RF-015-11).
 */
export class IssueAccessCodeUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly delivery: AccessCodeDelivery,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    actor: AdminActor;
    userId: string;
    purpose: AccessCodePurpose;
  }): Promise<UserWithAccessCode> {
    const now = this.clock.now();

    const { account, permissions, code } = await this.unitOfWork.run(
      async ({ users, permissions, accessCodes, audit }) => {
        const current = await users.findById(input.userId);
        if (!current) throw new UserNotFoundError();
        if (current.status !== 'active') {
          throw new InvalidUserStateError(
            'Reative a conta antes de emitir um código de acesso.',
          );
        }
        const activated = Boolean(current.passwordHash);
        if (input.purpose === 'activation' && activated) {
          throw new InvalidUserStateError(
            'A conta já foi ativada. Emita um código de recuperação.',
          );
        }
        if (input.purpose === 'recovery' && !activated) {
          throw new InvalidUserStateError(
            'A conta ainda não foi ativada. Emita um código de ativação.',
          );
        }

        const code = await issueAccessCode(
          accessCodes,
          current.id,
          input.purpose,
          now,
        );
        if (input.purpose === 'recovery') {
          await users.setPasswordChangeRequired(current.id, true, now);
        }
        await audit.record({
          action: 'user.access-code.issued',
          occurredAt: now,
          actorUserId: input.actor.id,
          actorLabel: input.actor.username,
          targetType: 'user',
          targetId: current.id,
          targetLabel: current.username,
          // O valor do código nunca integra a auditoria.
          after: { purpose: input.purpose },
        });
        const refreshed = (await users.findById(current.id)) ?? current;
        return {
          account: refreshed,
          permissions: await permissions.listForUser(current.id),
          code,
        };
      },
    );

    const delivered = await this.delivery.deliver({
      fullName: account.fullName,
      ...(account.email ? { email: account.email } : {}),
      purpose: input.purpose,
      code,
    });
    const expiresAt = new Date(now.getTime() + ACCESS_CODE_TTL_MS);
    return {
      account,
      permissions,
      issued:
        delivered.channel === 'email'
          ? { delivery: 'email', expiresAt, deliveryFailed: false }
          : {
              delivery: 'manual',
              code,
              expiresAt,
              deliveryFailed: Boolean(account.email),
            },
    };
  }
}
