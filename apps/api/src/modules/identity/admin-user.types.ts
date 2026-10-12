import type { Permission } from '@flex/contracts';
import type { UserAccount } from './repositories/user.repository';

/** Quem executa uma operação administrativa; `username` alimenta a auditoria. */
export interface AdminActor {
  id: string;
  username: string;
}

export interface UserView {
  account: UserAccount;
  permissions: Permission[];
}

/** Resultado da emissão de código; o valor só existe quando a entrega é manual. */
export interface IssuedAccessCode {
  delivery: 'email' | 'manual';
  code?: string;
  expiresAt: Date;
  /** Havia e-mail cadastrado, mas o provedor falhou depois da persistência. */
  deliveryFailed: boolean;
}

export interface UserWithAccessCode extends UserView {
  issued: IssuedAccessCode;
}
