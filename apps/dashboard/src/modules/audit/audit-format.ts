import {
    auditActionLabels,
    permissionAreas,
    type AuditEvent,
} from '@flex/contracts';

const permissionLabels = new Map<string, string>(
    permissionAreas.flatMap(({ area, items }) =>
        items.map((item): [string, string] => [
            item.id,
            `${area}: ${item.label}`,
        ]),
    ),
);

const fieldLabels: Record<string, string> = {
    fullName: 'Nome completo',
    username: 'Nome de usuário',
    email: 'E-mail',
    status: 'Estado',
    purpose: 'Finalidade',
    stage: 'Etapa',
};

const statusLabels: Record<string, string> = {
    active: 'Ativa',
    inactive: 'Inativa',
};

const purposeLabels: Record<string, string> = {
    activation: 'ativação',
    recovery: 'recuperação',
};

const personalDataLabels: Record<string, string> = {
    present: 'Dados pessoais preservados',
    anonymized: 'Dados pessoais anonimizados',
    deleted: 'Lead e dados pessoais excluídos',
};

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
});

/** Data e hora locais, como `10/10/2026 09:42`. */
export function formatAuditDate(value: string): string {
    const date = new Date(value);
    return `${dateFormat.format(date)} ${timeFormat.format(date)}`;
}

export function auditActionLabel(action: string): string {
    return (
        (auditActionLabels as Record<string, string | undefined>)[action] ??
        action
    );
}

function valueLabel(key: string, value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (key === 'status') return statusLabels[String(value)] ?? String(value);
    if (key === 'purpose') return purposeLabels[String(value)] ?? String(value);
    if (key === 'personalData')
        return personalDataLabels[String(value)] ?? String(value);
    return String(value);
}

function permissionLines(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((id) => permissionLabels.get(String(id)) ?? String(id));
}

const linesOf = (values: Record<string, unknown> | undefined): string[] =>
    values
        ? Object.entries(values).map(
              ([key, value]) =>
                  `${fieldLabels[key] ?? key}: ${valueLabel(key, value)}`,
          )
        : [];

export interface AuditPresentation {
    /** Descrição curta do objeto afetado, exibida na tabela. */
    object: string;
    before: string[];
    after: string[];
}

/** Traduz os valores anterior e novo de um evento em texto legível e somente leitura. */
export function presentAuditEvent(event: AuditEvent): AuditPresentation {
    const { action, target, before, after } = event;

    if (action === 'user.permissions.updated') {
        const was = permissionLines(before?.permissions);
        const now = permissionLines(after?.permissions);
        const added = now.filter((line) => !was.includes(line)).length;
        const removed = was.filter((line) => !now.includes(line)).length;
        return {
            object: `Permissões: +${added} · −${removed}`,
            before: was.length ? was : ['Nenhuma permissão'],
            after: now.length ? now : ['Nenhuma permissão'],
        };
    }

    if (action === 'user.access-code.issued') {
        const purpose = valueLabel('purpose', after?.purpose);
        return {
            object: `Conta ${target.label ?? ''}`.trim(),
            before: ['—'],
            after: [`Código de ${purpose} emitido · válido por 30 minutos`],
        };
    }

    if (action === 'user.activated' || action === 'user.deactivated') {
        return {
            object: `Conta ${target.label ?? ''}`.trim(),
            before: [valueLabel('status', before?.status)],
            after: [valueLabel('status', after?.status)],
        };
    }

    if (action === 'lead.deleted' || action === 'lead.anonymized') {
        return {
            object: target.label ?? 'Lead',
            before: [valueLabel('personalData', before?.personalData)],
            after: [valueLabel('personalData', after?.personalData)],
        };
    }

    const object =
        target.type === 'user'
            ? `Conta ${target.label ?? ''}`.trim()
            : (target.label ?? target.type);
    const beforeLines = linesOf(before);
    return {
        object,
        before: beforeLines.length ? beforeLines : ['—'],
        after: linesOf(after).length ? linesOf(after) : ['—'],
    };
}
