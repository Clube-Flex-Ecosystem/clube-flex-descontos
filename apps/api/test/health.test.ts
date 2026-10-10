import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { problemDetailsSchema } from '@flex/contracts';
import { createTestApp } from './support';

describe('verificações de saúde', () => {
  const { app, pool } = createTestApp();
  // Porta sem PostgreSQL: simula a indisponibilidade do banco.
  const unavailable = createTestApp(
    'postgres://flex:flex@127.0.0.1:1/flex_test',
  );

  afterAll(async () => {
    await pool.end();
    await unavailable.pool.end();
  });

  it('informa que o processo está ativo sem consultar o banco', async () => {
    const response = await request(unavailable.app).get('/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('informa prontidão quando o PostgreSQL migrado está acessível', async () => {
    const response = await request(app).get('/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('responde 503 padronizado quando o PostgreSQL está inacessível', async () => {
    const response = await request(unavailable.app).get('/v1/health/ready');

    expect(response.status).toBe(503);
    expect(response.type).toBe('application/problem+json');
    const problem = problemDetailsSchema.parse(response.body);
    expect(problem.code).toBe('SERVICE_UNAVAILABLE');
    expect(problem.requestId).toBe(response.headers['x-request-id']);
  });
});
