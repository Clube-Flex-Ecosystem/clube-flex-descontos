import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { CONTACT_CONSENT } from '@flex/contracts';
import { createTestApp, resetDatabase } from './support';

const context = createTestApp();
const input = {
  name: 'Maria Oliveira',
  whatsapp: '(21) 99876-5432',
  email: 'maria@example.com',
  consent: true,
  consentVersion: CONTACT_CONSENT.version,
  source: 'catalog',
};

describe('captação pública', () => {
  beforeEach(() => resetDatabase(context.pool));
  afterAll(() => context.pool.end());

  it('publica a definição vigente e exige sua versão no envio', async () => {
    await request(context.app)
      .get('/v1/public/contact-consent')
      .expect(200, CONTACT_CONSENT);
    await request(context.app)
      .post('/v1/public/contact-requests')
      .send({ ...input, consentVersion: 'anterior' })
      .expect(422);
  });

  it('cria lead sem responsável, origem protegida, solicitação e consentimento', async () => {
    const response = await request(context.app)
      .post('/v1/public/contact-requests')
      .send(input)
      .expect(202);
    expect(response.body).toEqual({
      message: 'Recebemos seus dados. Nossa equipe entrará em contato.',
    });
    const {
      rows: [lead],
    } = await context.pool.query(
      'SELECT l.*, s.name source_name, s.protected source_protected FROM leads l JOIN lead_sources s ON s.id = l.source_id',
    );
    expect(lead).toMatchObject({
      name: input.name,
      whatsapp: '+5521998765432',
      assignee_id: null,
      source_name: 'catálogo/site',
      source_protected: true,
    });
    expect(
      (await context.pool.query('SELECT * FROM lead_contact_requests'))
        .rowCount,
    ).toBe(1);
    expect(
      (await context.pool.query('SELECT version, source FROM lead_consents'))
        .rows[0],
    ).toEqual({ version: CONTACT_CONSENT.version, source: 'catalog' });
  });

  it('responde igual ao contato existente, preserva o lead e registra novo interesse', async () => {
    const first = await request(context.app)
      .post('/v1/public/contact-requests')
      .send(input)
      .expect(202);
    const second = await request(context.app)
      .post('/v1/public/contact-requests')
      .send({ ...input, name: 'Outro nome', email: 'outro@example.com' })
      .expect(202);
    expect(second.body).toEqual(first.body);
    const { rows } = await context.pool.query(
      'SELECT name, email, has_pending_interest FROM leads',
    );
    expect(rows).toEqual([
      { name: input.name, email: input.email, has_pending_interest: true },
    ]);
    expect(
      (await context.pool.query('SELECT * FROM lead_contact_requests'))
        .rowCount,
    ).toBe(2);
    expect(
      (await context.pool.query('SELECT * FROM lead_consents')).rowCount,
    ).toBe(2);
  });

  it('não registra IP na evidência de consentimento', async () => {
    await request(context.app)
      .post('/v1/public/contact-requests')
      .set('x-forwarded-for', '203.0.113.7')
      .send(input)
      .expect(202);
    const consent = (await context.pool.query('SELECT * FROM lead_consents'))
      .rows[0];
    expect(Object.keys(consent)).not.toContain('ip');
  });
});
