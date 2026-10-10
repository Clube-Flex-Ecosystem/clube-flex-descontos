import type { AccessCodePurpose } from './repositories/access-code.repository.types';
import type { EmailSender } from './services.types';

export type AccessCodeDeliveryResult =
  { channel: 'email' } | { channel: 'manual'; failure?: unknown };

interface DeliveryInput {
  fullName: string;
  email?: string;
  purpose: AccessCodePurpose;
  code: string;
}

/**
 * Entrega o código por e-mail quando possível. Sem e-mail, ou diante de falha do provedor,
 * o resultado `manual` indica que o código precisa ser entregue fora do sistema.
 */
export class AccessCodeDelivery {
  constructor(
    private readonly emailSender: EmailSender,
    private readonly dashboardUrl: string,
  ) {}

  async deliver(input: DeliveryInput): Promise<AccessCodeDeliveryResult> {
    if (!input.email) return { channel: 'manual' };
    try {
      await this.emailSender.send({ to: input.email, ...this.compose(input) });
      return { channel: 'email' };
    } catch (failure) {
      return { channel: 'manual', failure };
    }
  }

  private compose({ fullName, purpose, code }: DeliveryInput) {
    const firstName = fullName.split(' ')[0] ?? fullName;
    const activation = purpose === 'activation';
    return {
      subject: activation
        ? 'Seu código de ativação — Clube Flex'
        : 'Seu código de recuperação — Clube Flex',
      text: [
        `Olá, ${firstName}.`,
        '',
        activation
          ? 'Use o código abaixo para ativar sua conta e definir sua senha no painel do Clube Flex:'
          : 'Use o código abaixo para definir uma nova senha no painel do Clube Flex:',
        '',
        code,
        '',
        `Acesse: ${this.dashboardUrl}${activation ? '/ativar' : '/recuperar'}`,
        '',
        'O código vale por 30 minutos e só pode ser usado uma vez.',
        'Se você não esperava este e-mail, ignore esta mensagem.',
      ].join('\n'),
    };
  }
}
