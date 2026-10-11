import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { LeadSource } from '@flex/contracts';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Drawer } from '../../../shared/ui/dialogs';
import { controlClass } from '../../../shared/ui/form-controls';
import { sourcesQueryOptions } from '../queries/leads.query';
import { useCreateLead } from '../mutations/create-lead.mutation';

interface LeadFormData {
  name: string;
  whatsapp: string;
  email: string;
  sourceId: string;
  sourceDetail: string;
  referredBy: string;
  leaveUnassigned: boolean;
}

const emptyForm: LeadFormData = {
  name: '',
  whatsapp: '',
  email: '',
  sourceId: '',
  sourceDetail: '',
  referredBy: '',
  leaveUnassigned: false,
};

/** Formulário lateral para criar um lead manualmente. */
export function LeadCreateDrawer({ onClose }: { onClose: () => void }) {
  const { data: sources } = useQuery(sourcesQueryOptions);
  const create = useCreateLead();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await create.mutateAsync({
        ...form,
        email: form.email || undefined,
        sourceDetail: form.sourceDetail || undefined,
        referredBy: form.referredBy || undefined,
      });
      toast('Lead criado em “Novo”.');
      onClose();
    } catch (cause) {
      setError(describeError(cause));
    }
  };

  return (
    <Drawer
      title="Novo lead"
      description="O lead será criado na etapa Novo."
      submitLabel="Criar lead"
      loading={create.isPending}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {error ? (
        <Alert tone="danger" title="Não foi possível criar o lead.">
          {error}
        </Alert>
      ) : null}
      <LeadForm form={form} setForm={setForm} sources={sources} />
    </Drawer>
  );
}

function LeadForm({
  form,
  setForm,
  sources,
}: {
  form: LeadFormData;
  setForm: (form: LeadFormData) => void;
  sources: LeadSource[] | undefined;
}) {
  const update = <K extends keyof LeadFormData>(
    key: K,
    value: LeadFormData[K],
  ) => setForm({ ...form, [key]: value });

  return (
    <>
      <label className="grid gap-1.5">
        <span className="t-label">Nome</span>
        <input
          className={`${controlClass} h-control-md`}
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          required
        />
      </label>
      <label className="grid gap-1.5">
        <span className="t-label">WhatsApp</span>
        <input
          className={`${controlClass} h-control-md`}
          value={form.whatsapp}
          onChange={(event) => update('whatsapp', event.target.value)}
          required
        />
      </label>
      <label className="grid gap-1.5">
        <span className="t-label">E-mail (opcional)</span>
        <input
          type="email"
          className={`${controlClass} h-control-md`}
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="t-label">Origem</span>
        <select
          className={`${controlClass} h-control-md`}
          value={form.sourceId}
          onChange={(event) => update('sourceId', event.target.value)}
          required
        >
          <option value="">Selecione</option>
          {sources
            ?.filter((item) => item.active && item.kind === 'manual')
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="t-label">Detalhe da origem</span>
        <textarea
          className={`${controlClass} min-h-20 py-2`}
          value={form.sourceDetail}
          onChange={(event) => update('sourceDetail', event.target.value)}
        />
      </label>
      {sources?.find((item) => item.id === form.sourceId)?.requiresReferral ? (
        <label className="grid gap-1.5">
          <span className="t-label">Quem indicou</span>
          <input
            className={`${controlClass} h-control-md`}
            value={form.referredBy}
            onChange={(event) => update('referredBy', event.target.value)}
            required
          />
        </label>
      ) : null}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.leaveUnassigned}
          onChange={(event) => update('leaveUnassigned', event.target.checked)}
        />
        <span className="t-label">Deixar sem responsável</span>
      </label>
    </>
  );
}
