import { describe, expect, it } from 'vitest';
import {
  AUDIT_DEFAULT_PAGE_SIZE,
  AUDIT_MAX_PAGE_SIZE,
  auditQuerySchema,
  baseUsername,
  isAdministrator,
  leadRemovalOutcome,
  updateUserRequestSchema,
} from '@flex/contracts';

describe('regras compartilhadas de administração e privacidade', () => {
  it('exclui o lead somente quando nada operacional precisa ser preservado', () => {
    expect(
      leadRemovalOutcome({
        observationCount: 0,
        eventTypes: ['lead.created', 'contact-request.received'],
      }),
    ).toBe('delete');
    expect(
      leadRemovalOutcome({ observationCount: 1, eventTypes: ['lead.created'] }),
    ).toBe('anonymize');
    expect(
      leadRemovalOutcome({
        observationCount: 0,
        eventTypes: ['lead.created', 'lead.stage-changed'],
      }),
    ).toBe('anonymize');
  });

  it('reconhece administrador apenas com as duas capacidades (RN-021)', () => {
    expect(isAdministrator(['users.manage', 'permissions.manage'])).toBe(true);
    expect(isAdministrator(['users.manage'])).toBe(false);
    expect(isAdministrator([])).toBe(false);
  });

  it('gera a base do nome de usuário conforme RN-019', () => {
    expect(baseUsername('João da Silva')).toBe('joao.da.silva');
    expect(baseUsername('  Ana   Souza ')).toBe('ana.souza');
    expect(baseUsername('!!!')).toBe('usuario');
  });

  it('normaliza e valida o nome de usuário editado', () => {
    const base = { fullName: 'Pessoa' };
    expect(
      updateUserRequestSchema.parse({ ...base, username: ' Pessoa.UM ' })
        .username,
    ).toBe('pessoa.um');
    expect(
      updateUserRequestSchema.safeParse({ ...base, username: 'a b' }).success,
    ).toBe(false);
    expect(
      updateUserRequestSchema.safeParse({ ...base, username: 'ab' }).success,
    ).toBe(false);
  });

  it('aplica a paginação padrão e o limite da auditoria', () => {
    expect(auditQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: AUDIT_DEFAULT_PAGE_SIZE,
    });
    expect(
      auditQuerySchema.safeParse({ pageSize: AUDIT_MAX_PAGE_SIZE + 1 }).success,
    ).toBe(false);
    expect(auditQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(auditQuerySchema.safeParse({ occurredFrom: 'ontem' }).success).toBe(
      false,
    );
  });
});
