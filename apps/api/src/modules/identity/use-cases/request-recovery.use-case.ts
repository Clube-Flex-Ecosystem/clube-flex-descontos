import { issueAccessCode } from '../access-code-issuer';
import type { AccessCodeDelivery } from '../access-code-delivery';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { ApplicationLogger, Clock } from '../services.types';

/**
 * Solicitação pública de recuperação (UC-008). Nunca revela se a conta existe, está ativa
 * ou possui e-mail: o resultado é sempre vazio, e falhas de entrega ficam apenas no log.
 */
export class RequestRecoveryUseCase {
    constructor(
        private readonly unitOfWork: UnitOfWork,
        private readonly delivery: AccessCodeDelivery,
        private readonly clock: Clock,
        private readonly logger: ApplicationLogger,
    ) {}

    async execute(input: { username: string }): Promise<void> {
        const now = this.clock.now();
        const issued = await this.unitOfWork.run(
            async ({ users, accessCodes }) => {
                const user = await users.findByUsername(
                    input.username.trim().toLowerCase(),
                );
                // Sem e-mail, a recuperação depende de um administrador (UC-008, fluxo alternativo).
                if (!user || user.status !== 'active' || !user.email)
                    return null;
                const code = await issueAccessCode(
                    accessCodes,
                    user.id,
                    'recovery',
                    now,
                );
                return { user, code };
            },
        );
        if (!issued) return;

        // O envio não é aguardado, para que o tempo de resposta não distinga os casos.
        void this.delivery
            .deliver({
                fullName: issued.user.fullName,
                email: issued.user.email,
                purpose: 'recovery',
                code: issued.code,
            })
            .then((result) => {
                if (result.channel === 'manual') {
                    this.logger.warn(
                        { userId: issued.user.id },
                        'Falha ao enviar o código de recuperação por e-mail',
                    );
                }
            })
            .catch(() => undefined);
    }
}
