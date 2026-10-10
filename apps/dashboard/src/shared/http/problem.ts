import axios from 'axios';
import {
  fieldErrorMessages,
  problemDetailsSchema,
  type FieldError,
  type FieldErrorCode,
  type ProblemDetails,
} from '@flex/contracts';

/** Extrai o `application/problem+json` de uma falha HTTP, quando houver. */
export function toProblem(error: unknown): ProblemDetails | null {
  if (!axios.isAxiosError(error)) return null;
  const parsed = problemDetailsSchema.safeParse(error.response?.data);
  return parsed.success ? parsed.data : null;
}

/** Texto em português para um código estável de erro de campo. */
export function messageForCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return code in fieldErrorMessages
    ? fieldErrorMessages[code as FieldErrorCode]
    : fieldErrorMessages.INVALID_VALUE;
}

export function fieldErrorsOf(error: unknown): FieldError[] {
  return toProblem(error)?.errors ?? [];
}

/** Mensagem geral para falhas sem erro de campo correspondente. */
export function describeError(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }
  const problem = toProblem(error);
  if (problem?.code === 'RATE_LIMIT_EXCEEDED') {
    const retryAfter = Number(
      axios.isAxiosError(error) ? error.response?.headers['retry-after'] : NaN,
    );
    return Number.isFinite(retryAfter) && retryAfter > 0
      ? `Muitas tentativas. Aguarde ${retryAfter} segundos e tente novamente.`
      : 'Muitas tentativas. Aguarde um instante e tente novamente.';
  }
  if (problem?.code === 'INVALID_CREDENTIALS') {
    return 'Usuário ou senha incorretos.';
  }
  if (problem?.code === 'PERMISSION_DENIED') {
    return 'Você não possui permissão para realizar esta operação.';
  }
  if (problem?.code === 'CSRF_VALIDATION_FAILED') {
    return 'Sua sessão precisa ser atualizada. Recarregue a página e tente novamente.';
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}
