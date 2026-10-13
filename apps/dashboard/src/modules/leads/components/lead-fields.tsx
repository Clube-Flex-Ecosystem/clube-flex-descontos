import { Link } from '@tanstack/react-router';
import { useFormContext, useWatch } from 'react-hook-form';
import type { LeadSource } from '@flex/contracts';
import {
    InputField,
    SelectField,
    TextareaField,
} from '../../../shared/ui/form-controls';
import { fieldMessage } from '../../../shared/validation/server-errors';
import type { LeadFormValues } from '../lead-form';

/** WhatsApp já cadastrado em outro lead (nome conhecido quando está no quadro). */
export interface DuplicateLead {
    id: string;
    name?: string | undefined;
}

/** Campos de contato e origem, usados no cadastro e em "Editar dados". */
export function LeadFields({
    sources,
    sourceHint,
    duplicate,
    autoFocus = false,
}: {
    sources: LeadSource[];
    sourceHint?: string | undefined;
    duplicate: DuplicateLead | null;
    autoFocus?: boolean;
}) {
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<LeadFormValues>();
    const sourceId = useWatch({ control, name: 'sourceId' });
    const source = sources.find((item) => item.id === sourceId);

    return (
        <>
            <InputField
                label="Nome"
                placeholder="Ex.: Maria Souza"
                autoFocus={autoFocus}
                error={fieldMessage(errors.name?.message)}
                {...register('name')}
            />
            <InputField
                label="WhatsApp"
                placeholder="(21) 99999-9999"
                inputMode="tel"
                autoComplete="off"
                className="tnum"
                hint={
                    duplicate
                        ? undefined
                        : 'Com DDD. Um WhatsApp só pode pertencer a um lead.'
                }
                error={
                    duplicate
                        ? `Este WhatsApp já pertence a ${duplicate.name ?? 'outro lead'}.`
                        : fieldMessage(errors.whatsapp?.message)
                }
                {...register('whatsapp')}
            />
            {duplicate?.id ? (
                <p className="t-caption -mt-3">
                    <Link
                        to="/leads/$leadId"
                        params={{ leadId: duplicate.id }}
                        className="font-semibold text-danger"
                    >
                        Abrir lead existente
                    </Link>
                </p>
            ) : null}
            <InputField
                label="E-mail"
                placeholder="nome@exemplo.com"
                optional
                type="email"
                error={fieldMessage(errors.email?.message)}
                {...register('email')}
            />
            <SelectField
                label="Origem"
                hint={sourceHint}
                error={fieldMessage(errors.sourceId?.message)}
                {...register('sourceId')}
            >
                <option value="">Selecione</option>
                {sources.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </SelectField>
            <TextareaField
                label="Detalhe da origem"
                placeholder="Ex.: Indicação da recepção"
                optional
                error={fieldMessage(errors.sourceDetail?.message)}
                {...register('sourceDetail')}
            />
            {source?.requiresReferral ? (
                <InputField
                    label="Quem indicou"
                    placeholder="Nome de quem indicou"
                    error={fieldMessage(errors.referredBy?.message)}
                    {...register('referredBy')}
                />
            ) : null}
        </>
    );
}
