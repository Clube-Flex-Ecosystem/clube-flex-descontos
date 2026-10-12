import { useState } from 'react';
import type { LeadStage } from '@flex/contracts';
import { Alert } from '../../../shared/ui/alert';
import { ModalDialog } from '../../../shared/ui/dialogs';
import { SelectField, TextareaField } from '../../../shared/ui/form-controls';
import { leadStageName, leadStages } from '../lead-stages';

interface StageDialogProps {
    name: string;
    current: LeadStage;
    /** Destino pré-selecionado (ex.: coluna onde o cartão foi solto). */
    preset?: LeadStage | undefined;
    loading?: boolean;
    onConfirm: (stage: LeadStage, lossReason?: string) => void;
    onClose: () => void;
}

/**
 * Dialog de etapa, o mesmo no cartão do quadro e no detalhe: "Convertido" e "Perdido"
 * são confirmados explicitamente; "Perdido" aceita o motivo opcional.
 */
export function StageDialog({
    name,
    current,
    preset,
    loading = false,
    onConfirm,
    onClose,
}: StageDialogProps) {
    const options = leadStages.filter((stage) => stage.id !== current);
    const [target, setTarget] = useState<LeadStage>(
        preset ?? options[0]?.id ?? current,
    );
    const [reason, setReason] = useState('');
    const sensitive = target === 'converted' || target === 'lost';

    return (
        <ModalDialog
            title="Alterar etapa"
            description={`${name} está em “${leadStageName(current)}”.`}
            submitLabel={
                target === 'converted'
                    ? 'Confirmar conversão'
                    : target === 'lost'
                      ? 'Confirmar perda'
                      : 'Alterar etapa'
            }
            loading={loading}
            onClose={onClose}
            onSubmit={(event) => {
                event.preventDefault();
                onConfirm(
                    target,
                    target === 'lost' && reason.trim()
                        ? reason.trim()
                        : undefined,
                );
            }}
        >
            <SelectField
                label="Nova etapa"
                value={target}
                onChange={(event) => setTarget(event.target.value as LeadStage)}
            >
                {options.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                        {stage.name}
                    </option>
                ))}
            </SelectField>
            {target === 'lost' ? (
                <TextareaField
                    label="Motivo da perda"
                    optional
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                />
            ) : null}
            {sensitive ? (
                <Alert tone="info">
                    {target === 'converted'
                        ? 'O lead será marcado como convertido. Ele pode ser reaberto depois.'
                        : 'O lead será marcado como perdido. Ele pode ser reaberto depois.'}
                </Alert>
            ) : null}
        </ModalDialog>
    );
}
