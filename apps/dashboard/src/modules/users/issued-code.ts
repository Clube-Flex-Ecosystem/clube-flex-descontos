/**
 * Entrega do código de ativação do formulário de criação ao detalhe do usuário, somente em
 * memória: o valor nunca vai à URL, ao armazenamento do navegador ou ao cache de consultas.
 */
export interface IssuedCodeNotice {
  userId: string;
  purpose: 'activation' | 'recovery';
  delivery: 'email' | 'manual';
  /** Presente apenas na entrega manual. */
  code?: string;
  emailFailed: boolean;
}

let pending: IssuedCodeNotice | null = null;

export const issuedCodeHandoff = {
  put(notice: IssuedCodeNotice): void {
    pending = notice;
  },
  peek(userId: string): IssuedCodeNotice | null {
    return pending?.userId === userId ? pending : null;
  },
  clear(): void {
    pending = null;
  },
};
