import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { fieldErrorsOf, messageForCode } from '../http/problem';

/**
 * Associa os erros de campo devolvidos pela API aos controles do formulário.
 * Retorna `true` quando ao menos um erro foi associado a um campo conhecido.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[],
): boolean {
  let applied = false;
  for (const fieldError of fieldErrorsOf(error)) {
    const field = fields.find((name) => name === fieldError.field);
    if (!field) continue;
    setError(field, { type: 'server', message: fieldError.code });
    applied = true;
  }
  return applied;
}

/** Traduz o código de erro armazenado no formulário para o texto exibido. */
export function fieldMessage(code: string | undefined): string | undefined {
  return messageForCode(code);
}
