import type { FieldErrorCode } from '@flex/contracts';

/** Erros de aplicação, independentes de HTTP; os controllers os traduzem para o contrato. */

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Credenciais inválidas');
  }
}

/** Código inexistente, expirado, usado, invalidado ou de conta indisponível. */
export class InvalidAccessCodeError extends Error {
  constructor() {
    super('Código de acesso inválido');
  }
}

export class PasswordPolicyError extends Error {
  constructor(readonly code: FieldErrorCode) {
    super(`Senha recusada: ${code}`);
  }
}

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('Senha atual inválida');
  }
}

export class BootstrapRefusedError extends Error {
  constructor() {
    super(
      'O bootstrap só pode ser executado quando não existe nenhum usuário.',
    );
  }
}

// ─── Administração de usuários ───

export class UserNotFoundError extends Error {
  constructor() {
    super('Usuário não encontrado');
  }
}

/** A versão informada já não corresponde à persistida. */
export class UserVersionConflictError extends Error {
  constructor() {
    super('Versão do usuário desatualizada');
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super('Nome de usuário já utilizado');
  }
}

/** Proteções administrativas (RN-021, RF-016); a mensagem é destinada ao dashboard. */
export class ProtectedUserOperationError extends Error {}

/** A conta não está em um estado que permita a operação. */
export class InvalidUserStateError extends Error {}
