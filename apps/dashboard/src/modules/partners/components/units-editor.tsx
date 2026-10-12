import { useState } from 'react';
import { get, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { formatPostalCode } from '@flex/contracts';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import {
    InputField,
    Switch,
    TextareaField,
} from '../../../shared/ui/form-controls';
import { fieldMessage } from '../../../shared/validation/server-errors';
import {
    emptyUnit,
    type PartnerFormValues,
    type UnitFormValues,
} from '../schemas/partner-form';
import { ContactsEditor } from './contacts-editor';

/** Adiciona uma unidade (cabeçalho da seção); unidades novas começam abertas. */
export function AddUnitButton() {
    const { getValues, setValue } = useFormContext<PartnerFormValues>();
    return (
        <Button
            compact
            onClick={() =>
                setValue('units', [...getValues('units'), emptyUnit()], {
                    shouldDirty: true,
                })
            }
        >
            <Icon name="plus" />
            Adicionar unidade
        </Button>
    );
}

/** Unidades físicas do parceiro: opcionais e editadas dentro do mesmo agregado. */
export function UnitsEditor() {
    const {
        control,
        register,
        getValues,
        formState: { errors },
    } = useFormContext<PartnerFormValues>();
    const { fields, insert, remove } = useFieldArray({
        control,
        name: 'units',
    });
    // Unidades removidas continuam indicadas, com "Desfazer", até o salvamento.
    const [removed, setRemoved] = useState<
        { key: string; index: number; value: UnitFormValues }[]
    >([]);
    const units = useWatch({ control, name: 'units' });
    // Unidades novas começam abertas; as já salvas, resumidas até serem editadas. O conjunto
    // guarda as que o usuário inverteu em relação a esse padrão.
    const [toggledIds, setToggledIds] = useState<ReadonlySet<string>>(
        new Set(),
    );

    const toggle = (id: string) =>
        setToggledIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const message = (path: string) =>
        fieldMessage(get(errors, `${path}.message`) as string | undefined);

    return (
        <div className="grid gap-2">
            {fields.length === 0 && removed.length === 0 ? (
                <p className="t-body-small muted">
                    Nenhuma unidade. O parceiro pode operar sem unidade física.
                </p>
            ) : null}
            {fields.map((field, index) => {
                const unit = units[index];
                const hasError = Boolean(errors.units?.[index]);
                const isUnsaved = !unit?.itemId;
                const open = isUnsaved !== toggledIds.has(field.id) || hasError;
                const address = unit
                    ? [unit.street, unit.number].filter(Boolean).join(', ')
                    : '';
                return (
                    <div
                        key={field.id}
                        className="rounded-card border border-border"
                    >
                        <div className="flex items-start justify-between gap-3 p-3">
                            <div className="min-w-0">
                                <strong className="t-body font-semibold">
                                    {unit?.name || 'Nova unidade'}
                                </strong>{' '}
                                {unit?.active ? (
                                    <Badge tone="success" dot>
                                        Ativa
                                    </Badge>
                                ) : (
                                    <Badge dot>Inativa</Badge>
                                )}
                                <p className="t-body-small muted">
                                    {[
                                        address,
                                        unit?.neighborhood,
                                        unit?.city &&
                                            `${unit.city} – ${unit.state}`,
                                        unit?.postalCode &&
                                            `CEP ${formatPostalCode(unit.postalCode)}`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ') ||
                                        'Endereço não informado.'}
                                </p>
                                <p className="t-body-small muted tnum">
                                    {unit && unit.contacts.length > 0
                                        ? `${unit.contacts.length} ${unit.contacts.length === 1 ? 'contato próprio' : 'contatos próprios'}`
                                        : 'Usa os contatos gerais'}
                                    {unit?.openingHours
                                        ? ` · ${unit.openingHours}`
                                        : ''}
                                </p>
                            </div>
                            <Button
                                variant="quiet"
                                compact
                                aria-expanded={open}
                                onClick={() => toggle(field.id)}
                            >
                                {open ? 'Recolher' : 'Editar'}
                            </Button>
                        </div>
                        {open ? (
                            <div className="grid gap-4 border-t border-border p-3">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <InputField
                                        label="Nome da unidade"
                                        frameClassName="md:col-span-2"
                                        error={message(`units.${index}.name`)}
                                        {...register(`units.${index}.name`)}
                                    />
                                    <InputField
                                        label="CEP"
                                        inputMode="numeric"
                                        autoComplete="postal-code"
                                        error={message(
                                            `units.${index}.postalCode`,
                                        )}
                                        {...register(
                                            `units.${index}.postalCode`,
                                        )}
                                    />
                                    <InputField
                                        label="Estado"
                                        readOnly
                                        hint="Por enquanto, apenas o Rio de Janeiro."
                                        error={message(`units.${index}.state`)}
                                        {...register(`units.${index}.state`)}
                                    />
                                    <InputField
                                        label="Logradouro"
                                        frameClassName="md:col-span-2"
                                        error={message(`units.${index}.street`)}
                                        {...register(`units.${index}.street`)}
                                    />
                                    <InputField
                                        label="Número"
                                        hint="Use s/n quando não houver número."
                                        error={message(`units.${index}.number`)}
                                        {...register(`units.${index}.number`)}
                                    />
                                    <InputField
                                        label="Complemento"
                                        optional
                                        error={message(
                                            `units.${index}.complement`,
                                        )}
                                        {...register(
                                            `units.${index}.complement`,
                                        )}
                                    />
                                    <InputField
                                        label="Bairro"
                                        error={message(
                                            `units.${index}.neighborhood`,
                                        )}
                                        {...register(
                                            `units.${index}.neighborhood`,
                                        )}
                                    />
                                    <InputField
                                        label="Cidade"
                                        error={message(`units.${index}.city`)}
                                        {...register(`units.${index}.city`)}
                                    />
                                    <InputField
                                        label="Horário de atendimento"
                                        optional
                                        frameClassName="md:col-span-2"
                                        hint="Texto livre, como “Segunda a sexta, das 8h às 18h”."
                                        error={message(
                                            `units.${index}.openingHours`,
                                        )}
                                        {...register(
                                            `units.${index}.openingHours`,
                                        )}
                                    />
                                    <TextareaField
                                        label="Instruções da unidade"
                                        optional
                                        frameClassName="md:col-span-2"
                                        error={message(
                                            `units.${index}.instructions`,
                                        )}
                                        {...register(
                                            `units.${index}.instructions`,
                                        )}
                                    />
                                </div>
                                <ContactsEditor
                                    path={`units.${index}.contacts`}
                                    title="Contatos da unidade"
                                />
                                <p className="t-caption muted">
                                    Sem contato próprio de um tipo, a unidade
                                    exibe os contatos gerais correspondentes do
                                    parceiro.
                                </p>
                                <Switch
                                    label="Unidade ativa"
                                    hint={
                                        unit?.active
                                            ? 'Aparece no catálogo.'
                                            : 'Oculta do catálogo até ser reativada.'
                                    }
                                    {...register(`units.${index}.active`)}
                                />
                                <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3">
                                    <Button
                                        variant="danger-quiet"
                                        compact
                                        onClick={() => {
                                            // Captura o valor antes de remover: o updater roda depois.
                                            const value = getValues(
                                                `units.${index}`,
                                            );
                                            setRemoved((current) => [
                                                ...current,
                                                { key: field.id, index, value },
                                            ]);
                                            remove(index);
                                        }}
                                    >
                                        <Icon name="trash" />
                                        Remover unidade
                                    </Button>
                                    <Button
                                        compact
                                        onClick={() => toggle(field.id)}
                                    >
                                        Recolher
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                );
            })}
            {removed.map((item) => (
                <div
                    key={item.key}
                    className="flex items-start justify-between gap-3 rounded-card border border-dashed border-border bg-surface-muted p-3"
                >
                    <div className="min-w-0 text-placeholder line-through">
                        <strong className="t-body font-semibold">
                            {item.value.name || 'Nova unidade'}
                        </strong>
                        <p className="t-body-small">
                            {[item.value.street, item.value.number]
                                .filter(Boolean)
                                .join(', ') || 'Endereço não informado.'}
                        </p>
                    </div>
                    <span className="flex flex-none items-center gap-2">
                        <span className="t-caption muted">
                            Removida ao salvar
                        </span>
                        <Button
                            variant="quiet"
                            compact
                            onClick={() => {
                                insert(
                                    Math.min(
                                        item.index,
                                        getValues('units').length,
                                    ),
                                    item.value,
                                );
                                setRemoved((current) =>
                                    current.filter(
                                        (entry) => entry.key !== item.key,
                                    ),
                                );
                            }}
                        >
                            Desfazer
                        </Button>
                    </span>
                </div>
            ))}
        </div>
    );
}
