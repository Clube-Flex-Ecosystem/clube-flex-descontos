import express from 'express';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { problemDetailsSchema } from '@flex/contracts';
import { globalErrorHandler } from '../src/http/middlewares/global-error-handler.middleware';
import { createHttpLogger } from '../src/infrastructure/logger/http-logger';
import { createLogger } from '../src/infrastructure/logger/logger';
import { createLogCapture, createTestApp } from './support';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('pipeline HTTP', () => {
  const { app, pool, logs } = createTestApp();

  afterAll(() => pool.end());

  it('responde rota inexistente no contrato padronizado', async () => {
    const response = await request(app).get('/v1/inexistente');

    expect(response.status).toBe(404);
    expect(response.type).toBe('application/problem+json');
    const problem = problemDetailsSchema.parse(response.body);
    expect(problem.code).toBe('RESOURCE_NOT_FOUND');
    expect(problem.type).toBe('urn:flex:error:resource-not-found');
  });

  it('responde corpo JSON inválido com MALFORMED_REQUEST', async () => {
    const response = await request(app)
      .post('/v1/qualquer')
      .set('content-type', 'application/json')
      .send('{ invalido');

    expect(response.status).toBe(400);
    expect(problemDetailsSchema.parse(response.body).code).toBe(
      'MALFORMED_REQUEST',
    );
  });

  it('gera requestId UUID e o devolve no cabeçalho e no corpo do erro', async () => {
    const response = await request(app).get('/v1/inexistente');

    expect(response.headers['x-request-id']).toMatch(UUID);
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
  });

  it('reutiliza requestId recebido somente quando está no formato aceito', async () => {
    const valid = '3f2b1c6e-8a41-4a53-9a63-0b1f7f0b5a11';

    const accepted = await request(app)
      .get('/v1/inexistente')
      .set('x-request-id', valid);
    const rejected = await request(app)
      .get('/v1/inexistente')
      .set('x-request-id', 'qualquer coisa');

    expect(accepted.headers['x-request-id']).toBe(valid);
    expect(rejected.headers['x-request-id']).toMatch(UUID);
    expect(rejected.headers['x-request-id']).not.toBe('qualquer coisa');
  });

  it('não registra query string, cookies, autorização nem corpo nos logs', async () => {
    await request(app)
      .post('/v1/inexistente?token=segredo-na-query&code=123456')
      .set('cookie', '__Host-session=segredo-no-cookie')
      .set('authorization', 'Bearer segredo-no-header')
      .send({ password: 'segredo-no-corpo' });

    const output = logs.lines.join('\n');
    expect(output).toContain('/v1/inexistente');
    expect(output).not.toContain('segredo');
    expect(output).not.toContain('123456');
  });

  it('redige campos sensíveis registrados por engano', () => {
    const capture = createLogCapture();
    const logger = createLogger(
      { NODE_ENV: 'test', LOG_LEVEL: 'info' },
      capture.stream,
    );

    logger.info(
      {
        headers: { authorization: 'Bearer abc', cookie: 'sid=abc' },
        body: { code: '123456', newPassword: 'senha-nova' },
      },
      'teste',
    );

    const output = capture.lines.join('\n');
    expect(output).not.toContain('Bearer abc');
    expect(output).not.toContain('sid=abc');
    expect(output).not.toContain('123456');
    expect(output).toContain('[REDACTED]');
  });
});

describe('tratamento de erros inesperados', () => {
  it('retorna resposta genérica e mantém o stack trace apenas no log interno', async () => {
    const capture = createLogCapture();
    const logger = createLogger(
      { NODE_ENV: 'test', LOG_LEVEL: 'debug' },
      capture.stream,
    );
    const app = express();
    app.use(createHttpLogger(logger));
    app.get('/falha', () => {
      throw new Error('detalhe interno sensível');
    });
    app.use(globalErrorHandler);

    const response = await request(app).get('/falha');

    expect(response.status).toBe(500);
    const problem = problemDetailsSchema.parse(response.body);
    expect(problem.code).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('detalhe interno');

    const errorEntry = capture
      .entries()
      .find((entry) => entry.msg === 'Erro inesperado');
    expect(errorEntry.requestId).toBe(problem.requestId);
    expect(errorEntry.err.stack).toContain('detalhe interno sensível');
  });
});
