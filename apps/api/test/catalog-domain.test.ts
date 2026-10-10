import { describe, expect, it } from 'vitest';
import {
  createPartnerRequestSchema,
  effectiveCoupon,
  effectiveUnitContacts,
  isVisibleForPlan,
  normalizeNameKey,
  normalizePhone,
  publicationIssues,
} from '@flex/contracts';
import { slugify, uniqueSlug } from '../src/modules/catalog/domain/slug';

describe('normalização de nomes e identificadores', () => {
  it('trata acentos, caixa e espaços como o mesmo nome (RN-030)', () => {
    expect(normalizeNameKey('  Família ')).toBe(normalizeNameKey('familia'));
    expect(normalizeNameKey('Clínica   Vida')).toBe('clinica vida');
  });

  it('gera identificadores públicos legíveis e únicos', async () => {
    expect(slugify('Clínica Vida Plena!', 'parceiro')).toBe(
      'clinica-vida-plena',
    );
    expect(slugify('A', 'plano')).toBe('plano-a');
    expect(slugify('!!!', 'plano')).toBe('plano');

    const taken = new Set(['multi', 'multi-2']);
    expect(await uniqueSlug('multi', async (s) => taken.has(s))).toBe(
      'multi-3',
    );
  });
});

describe('normalização de telefones (RN-032)', () => {
  it.each([
    ['+55 21 99876-5432', '+5521998765432'],
    ['(21) 99876-5432', '+5521998765432'],
    ['21 3344-2100', '+552133442100'],
    ['5521998765432', '+5521998765432'],
    ['+55 55 99999-9999', '+5555999999999'],
  ])('normaliza %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    '99876-5432',
    '+1 202 555 0100',
    '(21) 89876-5432',
    '(01) 99876-5432',
    'telefone',
    '',
  ])('recusa "%s"', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe('regra de publicação (RN-001)', () => {
  const complete = {
    name: 'Clínica',
    description: 'Descrição',
    usageInstructions: 'Apresente a carteirinha',
    categories: [{ status: 'active' as const }],
    contacts: [{}],
    benefits: [{ planId: 'plano-ativo' }],
  };
  const activePlans = new Set(['plano-ativo']);

  it('aceita um parceiro completo, mesmo sem unidade ou cupom', () => {
    expect(publicationIssues(complete, activePlans)).toEqual([]);
  });

  it('informa todas as pendências de uma vez', () => {
    const issues = publicationIssues(
      {
        name: 'Clínica',
        categories: [{ status: 'inactive' }],
        contacts: [],
        benefits: [{ planId: 'plano-inativo' }],
      },
      activePlans,
    );
    expect(issues.map((issue) => issue.code).sort()).toEqual(
      [
        'PUBLICATION_BENEFIT_REQUIRED',
        'PUBLICATION_CATEGORY_REQUIRED',
        'PUBLICATION_CONTACT_REQUIRED',
        'PUBLICATION_DESCRIPTION_REQUIRED',
        'PUBLICATION_INSTRUCTIONS_REQUIRED',
      ].sort(),
    );
  });

  it('exige categoria ativa e benefício para plano ativo', () => {
    const issues = publicationIssues(
      {
        ...complete,
        categories: [{ status: 'inactive' }, { status: 'inactive' }],
        benefits: [{ planId: 'outro' }],
      },
      activePlans,
    );
    expect(issues.map((issue) => issue.field)).toEqual([
      'categoryIds',
      'benefits',
    ]);
  });
});

describe('visibilidade pública (RN-003) e cupons (RN-016)', () => {
  const plan = { id: 'p1', status: 'active' as const };
  const partner = {
    status: 'published' as const,
    categories: [{ status: 'active' as const }],
    benefits: [{ planId: 'p1' }],
  };

  it('exige publicado, categoria ativa e benefício do plano ativo', () => {
    expect(isVisibleForPlan(partner, plan)).toBe(true);
    expect(isVisibleForPlan({ ...partner, status: 'inactive' }, plan)).toBe(
      false,
    );
    expect(isVisibleForPlan({ ...partner, status: 'draft' }, plan)).toBe(false);
    expect(
      isVisibleForPlan(
        { ...partner, categories: [{ status: 'inactive' }] },
        plan,
      ),
    ).toBe(false);
    expect(isVisibleForPlan(partner, { id: 'p1', status: 'inactive' })).toBe(
      false,
    );
    expect(isVisibleForPlan(partner, { id: 'p2', status: 'active' })).toBe(
      false,
    );
  });

  it('o cupom do plano substitui o geral', () => {
    expect(effectiveCoupon({ generalCoupon: 'GERAL' }, {})).toBe('GERAL');
    expect(
      effectiveCoupon({ generalCoupon: 'GERAL' }, { coupon: 'PLANO' }),
    ).toBe('PLANO');
    expect(effectiveCoupon({}, {})).toBeUndefined();
  });

  it('a unidade herda por tipo os contatos gerais ausentes (RN-027)', () => {
    const contacts = effectiveUnitContacts(
      [{ type: 'phone' as const, value: '+552133333333' }],
      [
        { type: 'phone' as const, value: '+552100000000' },
        { type: 'whatsapp' as const, value: '+5521999999999' },
      ],
    );
    expect(contacts).toEqual([
      { type: 'phone', value: '+552133333333' },
      { type: 'whatsapp', value: '+5521999999999', inherited: true },
    ]);
  });
});

describe('entrada do parceiro', () => {
  const valid = {
    name: '  Clínica Vida  ',
    categoryIds: [],
    contacts: [{ type: 'whatsapp', value: '(21) 99876-5432', label: '' }],
    units: [],
    benefits: [
      {
        planId: crypto.randomUUID(),
        discountPercentage: 20,
        coupon: ' FLEX ',
      },
    ],
  };

  it('remove espaços, normaliza contatos e cupons e omite o que está em branco', () => {
    const parsed = createPartnerRequestSchema.parse(valid);
    expect(parsed.name).toBe('Clínica Vida');
    expect(parsed.contacts[0]).toMatchObject({ value: '+5521998765432' });
    expect(parsed.contacts[0]?.label).toBeUndefined();
    expect(parsed.benefits[0]?.coupon).toBe('FLEX');
    expect(parsed.featured).toBe(false);
  });

  it('localiza erros por campo com códigos estáveis', () => {
    const result = createPartnerRequestSchema.safeParse({
      ...valid,
      name: '   ',
      website: 'ftp://exemplo.com',
      contacts: [{ type: 'phone', value: '123' }],
      benefits: [{ planId: crypto.randomUUID(), discountPercentage: 150 }],
    });
    expect(result.success).toBe(false);
    const byPath = Object.fromEntries(
      result.error!.issues.map((i) => [i.path.join('.'), i.message]),
    );
    expect(byPath).toMatchObject({
      name: 'REQUIRED',
      website: 'INVALID_URL',
      'contacts.0.value': 'INVALID_PHONE_NUMBER',
      'benefits.0.discountPercentage': 'INVALID_PERCENTAGE',
    });
  });
});
