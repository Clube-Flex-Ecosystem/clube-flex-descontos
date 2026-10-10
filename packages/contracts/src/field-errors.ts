import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './auth';

/** Códigos estáveis de erro de campo; consumidores decidem pelo código, nunca pelo texto. */
export const fieldErrorMessages = {
  REQUIRED: 'Preencha este campo.',
  INVALID_VALUE: 'Valor inválido.',
  PASSWORD_TOO_SHORT: `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  PASSWORD_TOO_LONG: `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
  PASSWORD_TOO_COMMON:
    'Esta senha é muito comum ou previsível. Escolha outra, como uma frase longa.',
  PASSWORD_CONFIRMATION_MISMATCH: 'A confirmação não confere com a nova senha.',
  INVALID_CURRENT_PASSWORD: 'A senha atual está incorreta.',
  INVALID_ACCESS_CODE: 'Código inválido, expirado ou já utilizado.',
  INVALID_PHONE_NUMBER: 'Informe um número válido com DDD.',
  INVALID_URL: 'Informe um endereço iniciado por http:// ou https://.',
  INVALID_POSTAL_CODE: 'Informe um CEP com 8 dígitos.',
  INVALID_STATE:
    'Por enquanto, apenas unidades no estado do Rio de Janeiro (RJ).',
  INVALID_SLUG:
    'Use apenas letras minúsculas, números e hífens, de 3 a 120 caracteres.',
  INVALID_PERCENTAGE: 'Informe um número inteiro de 1 a 100.',
  DUPLICATE_NAME: 'Já existe um registro com este nome.',
  DUPLICATE_SLUG: 'Este endereço público já está em uso.',
  DUPLICATE_PLAN_BENEFIT: 'Há mais de um benefício para o mesmo plano.',
  UNKNOWN_REFERENCE: 'O item informado não existe.',
  INACTIVE_REFERENCE: 'O item informado está inativo e não pode ser associado.',
  PUBLICATION_DESCRIPTION_REQUIRED: 'Informe a descrição para publicar.',
  PUBLICATION_INSTRUCTIONS_REQUIRED:
    'Informe as instruções de uso do desconto para publicar.',
  PUBLICATION_CATEGORY_REQUIRED:
    'Associe ao menos uma categoria ativa para publicar.',
  PUBLICATION_CONTACT_REQUIRED:
    'Informe ao menos um telefone ou WhatsApp para publicar.',
  PUBLICATION_BENEFIT_REQUIRED:
    'Defina o desconto em ao menos um plano ativo para publicar.',
} as const;

export type FieldErrorCode = keyof typeof fieldErrorMessages;
