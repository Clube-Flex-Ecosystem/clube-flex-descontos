import type { FieldErrorCode } from '@flex/contracts';

/** Erros de aplicação do catálogo, independentes de HTTP; os controllers os traduzem. */

export interface FieldIssue {
  field: string;
  code: FieldErrorCode;
}

export class ResourceNotFoundError extends Error {
  constructor() {
    super('Recurso não encontrado');
  }
}

/** A versão informada não corresponde mais à persistida. */
export class VersionConflictError extends Error {
  constructor() {
    super('Versão desatualizada');
  }
}

/** Violação de unicidade de uma chave natural (nome ou identificador público). */
export class DuplicateResourceError extends Error {
  constructor(readonly issues: FieldIssue[]) {
    super('Recurso duplicado');
  }
}

export class InvalidResourceStateError extends Error {}

/** Registro com histórico ou associações que precisa ser preservado. */
export class ProtectedResourceError extends Error {}

export class PublicationRequirementsError extends Error {
  constructor(readonly issues: FieldIssue[]) {
    super('Requisitos de publicação não atendidos');
  }
}

/** Referências a categorias, planos ou itens do agregado inexistentes ou indisponíveis. */
export class ReferenceValidationError extends Error {
  constructor(readonly issues: FieldIssue[]) {
    super('Referências inválidas');
  }
}
