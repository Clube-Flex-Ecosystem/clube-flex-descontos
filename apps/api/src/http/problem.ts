import type { Request, Response } from 'express';
import type { ErrorCode, ProblemDetails } from '@flex/contracts';

const catalog: Record<
  ErrorCode,
  { status: number; title: string; detail: string }
> = {
  MALFORMED_REQUEST: {
    status: 400,
    title: 'Requisição malformada',
    detail: 'Não foi possível interpretar a requisição.',
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

export function sendProblem(
  req: Request,
  res: Response,
  code: ErrorCode,
): void {
  const { status, title, detail } = catalog[code];
  const body: ProblemDetails = {
    type: `urn:flex:error:${typeSlug(code)}`,
    title,
    status,
    code,
    detail,
    requestId: String(req.id),
  };
  res.status(status).type('application/problem+json').json(body);
}
