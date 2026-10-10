import type { Request, Response } from 'express';
import type { ErrorCode, FieldError, ProblemDetails } from '@flex/contracts';

const catalog: Record<
  ErrorCode,
  { status: number; title: string; detail: string }
> = {
  MALFORMED_REQUEST: {
    status: 400,
    title: 'Requisição malformada',
    detail: 'Não foi possível interpretar a requisição.',
  },
  AUTHENTICATION_REQUIRED: {
    status: 401,
    title: 'Autenticação necessária',
    detail: 'Entre com sua conta para continuar.',
  },
  INVALID_CREDENTIALS: {
    status: 401,
    title: 'Credenciais inválidas',
    detail: 'Usuário ou senha incorretos.',
  },
  PERMISSION_DENIED: {
    status: 403,
    title: 'Permissão negada',
    detail: 'Você não possui permissão para realizar esta operação.',
  },
  CSRF_VALIDATION_FAILED: {
    status: 403,
    title: 'Validação de segurança falhou',
    detail: 'Não foi possível validar a origem da requisição.',
  },
  RESOURCE_NOT_FOUND: {
    status: 404,
    title: 'Recurso não encontrado',
    detail: 'O recurso solicitado não existe.',
  },
  VALIDATION_ERROR: {
    status: 422,
    title: 'Dados inválidos',
    detail: 'Revise os campos informados.',
  },
  PUBLICATION_REQUIREMENTS_NOT_MET: {
    status: 422,
    title: 'Publicação não permitida',
    detail: 'O parceiro ainda não atende às condições de publicação.',
  },
  DUPLICATE_RESOURCE: {
    status: 409,
    title: 'Registro duplicado',
    detail: 'Já existe um registro com os mesmos dados.',
  },
  INVALID_RESOURCE_STATE: {
    status: 409,
    title: 'Estado incompatível',
    detail: 'O recurso não está em um estado que permita esta operação.',
  },
  RESOURCE_VERSION_CONFLICT: {
    status: 409,
    title: 'Conflito de versão',
    detail:
      'O registro foi alterado por outra pessoa. Carregue a versão atual e tente novamente.',
  },
  PROTECTED_RESOURCE: {
    status: 409,
    title: 'Registro protegido',
    detail: 'O registro possui histórico ou associações e deve ser preservado.',
  },
  RESOURCE_VERSION_REQUIRED: {
    status: 428,
    title: 'Versão obrigatória',
    detail: 'Informe a versão conhecida do recurso no cabeçalho If-Match.',
  },
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    title: 'Muitas tentativas',
    detail: 'Aguarde um instante antes de tentar novamente.',
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    title: 'Erro interno',
    detail:
      'Ocorreu um erro inesperado. Informe o identificador da requisição ao suporte.',
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    title: 'Serviço indisponível',
    detail: 'O serviço não está disponível no momento.',
  },
};

const typeSlug = (code: ErrorCode) => code.toLowerCase().replaceAll('_', '-');

export interface ProblemOptions {
  /** Erros localizados por campo. */
  errors?: FieldError[];
  /** Substitui a mensagem padrão por uma mensagem de domínio, já em português. */
  detail?: string;
  headers?: Record<string, string>;
}

export function sendProblem(
  req: Request,
  res: Response,
  code: ErrorCode,
  options: ProblemOptions = {},
): void {
  const { status, title, detail: defaultDetail } = catalog[code];
  const detail = options.detail ?? defaultDetail;
  const body: ProblemDetails = {
    type: `urn:flex:error:${typeSlug(code)}`,
    title,
    status,
    code,
    detail,
    requestId: String(req.id),
    ...(options.errors?.length ? { errors: options.errors } : {}),
  };
  for (const [name, value] of Object.entries(options.headers ?? {})) {
    res.setHeader(name, value);
  }
  res.status(status).type('application/problem+json').json(body);
}
