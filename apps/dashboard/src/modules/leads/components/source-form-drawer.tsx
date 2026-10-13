import { useState } from 'react';
import type { LeadSource } from '@flex/contracts';
import { useToast } from '../../../shared/feedback/toast';
import { describeError, toProblem } from '../../../shared/http/problem';
import { isVersionConflict } from '../../../shared/http/versioning';
import { Alert } from '../../../shared/ui/alert';
import { ConfirmDialog, Drawer } from '../../../shared/ui/dialogs';
import { InputField, Switch } from '../../../shared/ui/form-controls';
import {
    useCreateSource,
    useSetSourceActive,
    useUpdateSource,
} from '../mutations/sources.mutations';

const DEACTIVATE_BODY =
    'A origem deixa de aparecer nas seleções de novos leads. Leads existentes mantêm a origem.';

/** Cadastro e edição de origem em dialog lateral; erros ficam dentro do dialog. */
export function SourceFormDrawer({
    source,
    onClose,
}: {
    source?: LeadSource;
    onClose: () => void;
}) {
    const isNew = !source;
    const create = useCreateSource();
    const update = useUpdateSource();
    const setActive = useSetSourceActive();
    const toast = useToast();
    const [name, setName] = useState(source?.name ?? '');
    const [referral, setReferral] = useState(source?.requiresReferral ?? false);
    const [active, setActiveValue] = useState(source?.active ?? true);
    const [nameError, setNameError] = useState<string | null>(null);
    const [failure, setFailure] = useState<string | null>(null);
    const [confirmingDeactivation, setConfirmingDeactivation] = useState(false);
    const busy = create.isPending || update.isPending || setActive.isPending;

    const save = async () => {
        setFailure(null);
        setNameError(null);
        if (!name.trim()) {
            setNameError('Preencha este campo.');
            return;
        }
        const body = { name: name.trim(), requiresReferral: referral };
        try {
            let saved = source
                ? await update.mutateAsync({
                      id: source.id,
                      version: source.version,
                      body,
                  })
                : await create.mutateAsync(body);
            if (saved.active !== active)
                saved = await setActive.mutateAsync({
                    id: saved.id,
                    version: saved.version,
                    active,
                });
            toast(`“${saved.name}” ${isNew ? 'cadastrada' : 'atualizada'}.`);
            onClose();
        } catch (error) {
            if (toProblem(error)?.code === 'DUPLICATE_RESOURCE')
                setNameError('Já existe um registro com este nome.');
            else
                setFailure(
                    isVersionConflict(error)
                        ? 'Outra pessoa alterou esta origem. Feche e abra de novo para carregar a versão atual.'
                        : describeError(error),
                );
        }
    };

    return (
        <>
            <Drawer
                title={isNew ? 'Nova origem' : 'Editar origem'}
                description={
                    source?.name ??
                    'Canal usado para identificar como o lead chegou.'
                }
                loading={busy}
                onClose={onClose}
                onSubmit={(event) => {
                    event.preventDefault();
                    // Desativar pelo dialog pede a mesma confirmação da ação do menu.
                    if (source?.active && !active)
                        setConfirmingDeactivation(true);
                    else void save();
                }}
            >
                {failure ? (
                    <Alert
                        tone="danger"
                        title="Não foi possível salvar a origem."
                    >
                        {failure}
                    </Alert>
                ) : null}
                <InputField
                    label="Nome"
                    placeholder="Ex.: Indicação"
                    autoFocus
                    hint="Deve ser único, sem diferenciar maiúsculas e acentos."
                    error={nameError ?? undefined}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
                <Switch
                    label="Origem por indicação"
                    hint="Exige informar quem indicou no cadastro do lead."
                    checked={referral}
                    onChange={(event) => setReferral(event.target.checked)}
                />
                <Switch
                    label="Ativa"
                    hint={
                        active
                            ? 'Disponível nas seleções de novos leads.'
                            : 'Oculta até ser reativada.'
                    }
                    checked={active}
                    onChange={(event) => setActiveValue(event.target.checked)}
                />
            </Drawer>
            {confirmingDeactivation && source ? (
                <ConfirmDialog
                    title={`Desativar “${source.name}”?`}
                    body={DEACTIVATE_BODY}
                    confirmLabel="Desativar"
                    onCancel={() => setConfirmingDeactivation(false)}
                    onConfirm={() => {
                        setConfirmingDeactivation(false);
                        void save();
                    }}
                />
            ) : null}
        </>
    );
}

export { DEACTIVATE_BODY as sourceDeactivationBody };
