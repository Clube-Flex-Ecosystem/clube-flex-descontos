import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useBlocker, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Controller,
  FormProvider,
  get,
  useForm,
  useWatch,
  type FieldErrors,
} from 'react-hook-form';
import {
  normalizeNameKey,
  publicationIssues,
  type Category,
  type Partner,
  type Plan,
} from '@flex/contracts';
import { useCan } from '../../auth';
import { useToast } from '../../../shared/feedback/toast';
import { describeError, fieldErrorsOf } from '../../../shared/http/problem';
import { isVersionConflict } from '../../../shared/http/versioning';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import {
  Chip,
  InputField,
  Switch,
  TextareaField,
} from '../../../shared/ui/form-controls';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-parts';
import { fieldMessage } from '../../../shared/validation/server-errors';
import {
  useCreatePartner,
  usePartnerCommand,
  useReplacePartner,
} from '../mutations/partners.mutations';
import { partnerKey, partnersKey } from '../queries/partners.query';
import {
  applyPartnerServerErrors,
  newPartnerValues,
  partnerFormSchema,
  toFormValues,
  toRequest,
  type PartnerFormValues,
} from '../schemas/partner-form';
import type { PartnerCommand } from '../api/partners.api';
import { BenefitsEditor } from './benefits-editor';
import { ContactsEditor } from './contacts-editor';
import { UnitsEditor } from './units-editor';
import { PartnerStatusBadge } from './partner-status-badge';

interface PartnerFormProps {
  /** Parceiro em edição; ausente no cadastro. */
  partner?: Partner;
  plans: Plan[];
  categories: Category[];
  /** Demais parceiros já carregados, para alertar sobre possível duplicidade. */
  partners: Partner[];
}

type SectionId =
  'sec-main' | 'sec-cat' | 'sec-units' | 'sec-benefits' | 'sec-publish';
type SectionState = 'error' | 'done' | 'todo';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'sec-main', label: 'Dados principais' },
  { id: 'sec-cat', label: 'Categorias e contatos' },
  { id: 'sec-units', label: 'Unidades' },
  { id: 'sec-benefits', label: 'Benefícios e cupons' },
  { id: 'sec-publish', label: 'Publicação' },
];

function countErrors(errors: FieldErrors): number {
  let total = 0;
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const candidate = node as { message?: unknown; type?: unknown };
    if (typeof candidate.message === 'string' && candidate.type) {
      total += 1;
      return;
    }
    for (const value of Object.values(node)) visit(value);
  };
  visit(errors);
  return total;
}

function Section({
  id,
  title,
  description,
  action,
  children,
}: {
  id: SectionId;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 rounded-xl border border-border bg-surface shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
        <div>
          <h2 id={`${id}-title`} className="t-card">
            {title}
          </h2>
          <p className="t-small muted">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const stateLabel: Record<SectionState, string> = {
  error: 'Com erro',
  done: 'Completa',
  todo: 'Pendente',
};

function SectionStatus({ state }: { state: SectionState }) {
  const style =
    state === 'error'
      ? 'bg-danger text-primary-foreground'
      : state === 'done'
        ? 'bg-success-soft text-success'
        : 'ring-[1.5px] ring-border-strong ring-inset';
  return (
    <span
      className={`grid size-4.5 flex-none place-items-center rounded-full ${style}`}
    >
      {state === 'error' ? <Icon name="alert" size="sm" /> : null}
      {state === 'done' ? <Icon name="check" size="sm" /> : null}
      <span className="sr-only">{stateLabel[state]}</span>
    </span>
  );
}

export function PartnerForm({
  partner,
  plans,
  categories,
  partners,
}: PartnerFormProps) {
  const isNew = !partner;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const create = useCreatePartner();
  const replace = useReplacePartner();
  const command = usePartnerCommand();
  const canSave = useCan(isNew ? 'partners.create' : 'partners.update');
  const canPublish = useCan('partners.publish');

  const methods = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema(isNew)),
    defaultValues: partner
      ? toFormValues(partner, plans)
      : newPartnerValues(plans),
  });
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitted },
  } = methods;
  const values = useWatch({ control }) as PartnerFormValues;

  const [failure, setFailure] = useState<{
    message: string;
    details: string[];
    conflict: boolean;
  } | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('sec-main');
  // Depois de criar, a navegação para o detalhe não é uma saída com alterações pendentes.
  const [createdId, setCreatedId] = useState<string | null>(null);

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty && createdId === null,
    enableBeforeUnload: () => isDirty && createdId === null,
    withResolver: true,
  });

  // Depois de criado, segue para o detalhe; a saída deixa de contar como alteração pendente.
  useEffect(() => {
    if (createdId) {
      void navigate({
        to: '/parceiros/$partnerId',
        params: { partnerId: createdId },
        replace: true,
      });
    }
  }, [createdId, navigate]);

  const busy = create.isPending || replace.isPending || command.isPending;

  // ───── Estado derivado para as seções e a lista de requisitos ─────
  const activePlanIds = new Set(
    plans.filter((plan) => plan.status === 'active').map((plan) => plan.id),
  );
  const enabledBenefits = values.benefits.filter(
    (benefit) =>
      benefit.enabled &&
      Number.isInteger(Number(benefit.discountPercentage)) &&
      Number(benefit.discountPercentage) >= 1 &&
      Number(benefit.discountPercentage) <= 100,
  );
  const issues = publicationIssues(
    {
      name: values.name,
      description: values.description,
      usageInstructions: values.usageInstructions,
      categories: categories.filter((category) =>
        values.categoryIds.includes(category.id),
      ),
      contacts: values.contacts.filter((contact) => contact.value.trim()),
      benefits: enabledBenefits,
    },
    activePlanIds,
  );
  const missing = new Set(issues.map((issue) => issue.field));
  const pendingChanges = isNew || isDirty;
  const canRunPublish =
    !isNew &&
    canPublish &&
    partner.status !== 'published' &&
    issues.length === 0 &&
    !isDirty &&
    !busy;

  const requirements: { label: string; met: boolean }[] = [
    { label: 'Descrição informada', met: !missing.has('description') },
    {
      label: 'Instruções de uso informadas',
      met: !missing.has('usageInstructions'),
    },
    { label: 'Ao menos uma categoria ativa', met: !missing.has('categoryIds') },
    {
      label: 'Ao menos um telefone ou WhatsApp',
      met: !missing.has('contacts'),
    },
    {
      label: 'Benefício para ao menos um plano ativo',
      met: !missing.has('benefits'),
    },
    { label: 'Alterações salvas', met: !isNew && !isDirty },
  ];

  const hasErrors = (...keys: (keyof PartnerFormValues)[]) =>
    keys.some((key) => Boolean(errors[key]));
  const sectionStates: Record<SectionId, SectionState> = {
    'sec-main': hasErrors(
      'name',
      'slug',
      'website',
      'description',
      'usageInstructions',
    )
      ? 'error'
      : values.name.trim() &&
          values.description.trim() &&
          values.usageInstructions.trim()
        ? 'done'
        : 'todo',
    'sec-cat': hasErrors('categoryIds', 'contacts')
      ? 'error'
      : values.categoryIds.length > 0 && values.contacts.length > 0
        ? 'done'
        : 'todo',
    // As unidades são opcionais: ficam completas enquanto não houver erro.
    'sec-units': hasErrors('units') ? 'error' : 'done',
    'sec-benefits': hasErrors('benefits', 'generalCoupon')
      ? 'error'
      : enabledBenefits.length > 0
        ? 'done'
        : 'todo',
    'sec-publish': partner?.status === 'published' ? 'done' : 'todo',
  };

  const similar = values.name.trim()
    ? partners.find(
        (other) =>
          other.id !== partner?.id &&
          normalizeNameKey(other.name) === normalizeNameKey(values.name),
      )
    : undefined;

  // ───── Ações ─────
  const reportFailure = (error: unknown, applied: boolean) => {
    if (applied) {
      setFailure({
        message: 'Revise os campos destacados antes de salvar.',
        details: [],
        conflict: false,
      });
      return;
    }
    setFailure({
      message: describeError(error),
      details: fieldErrorsOf(error).map((fieldError) => fieldError.message),
      conflict: isVersionConflict(error),
    });
  };

  const save = handleSubmit(async (formValues) => {
    setFailure(null);
    const { body, benefitRows } = toRequest(formValues);
    try {
      if (partner) {
        await replace.mutateAsync({
          id: partner.id,
          version: partner.version,
          body,
        });
        toast('Alterações salvas.');
      } else {
        const created = await create.mutateAsync(body);
        toast('Parceiro criado como rascunho.');
        setCreatedId(created.id);
      }
    } catch (error) {
      const applied = applyPartnerServerErrors(error, setError, benefitRows);
      reportFailure(error, applied.length > 0);
    }
  });

  const run = (name: PartnerCommand, message: string) => {
    if (!partner) return;
    setFailure(null);
    command.mutate(
      { id: partner.id, version: partner.version, command: name },
      {
        onSuccess: () => toast(message),
        onError: (error) => reportFailure(error, false),
      },
    );
  };

  const reload = () => {
    if (!partner) return;
    // A recarga substitui o parceiro em cache; o formulário reinicia com a nova versão.
    void queryClient.refetchQueries({ queryKey: partnerKey(partner.id) });
    void queryClient.invalidateQueries({ queryKey: partnersKey, exact: true });
  };

  const scrollTo = (id: SectionId) => {
    setActiveSection(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const errorCount = countErrors(errors);
  const rootMessage = (path: string) =>
    fieldMessage(get(errors, `${path}.root.message`) as string | undefined);

  return (
    <FormProvider {...methods}>
      <Link
        to="/parceiros"
        className="t-label mb-2 inline-flex min-h-11 items-center gap-1 text-muted-foreground no-underline hover:text-foreground md:min-h-0"
      >
        <Icon name="left" />
        Parceiros
      </Link>
      <PageHeader
        title={isNew ? 'Novo parceiro' : partner.name}
        status={<PartnerStatusBadge status={partner?.status ?? 'draft'} />}
        description={
          isNew || partner.status === 'draft'
            ? 'Criado como rascunho; só aparece no catálogo depois de publicado.'
            : partner.status === 'published'
              ? 'Publicado: alterações válidas aparecem imediatamente no catálogo.'
              : 'Desativado: fora do catálogo, com todos os dados preservados.'
        }
        actions={
          <>
            <Button onClick={() => void navigate({ to: '/parceiros' })}>
              Cancelar
            </Button>
            {canSave ? (
              <Button
                type="submit"
                form="partner-form"
                variant="primary"
                loading={create.isPending || replace.isPending}
              >
                Salvar
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-5 md:grid-cols-[184px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_272px]">
        <nav
          aria-label="Seções do formulário"
          className="sticky top-12 z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2 md:top-20 md:row-span-2 md:mx-0 md:grid md:content-start md:gap-px md:overflow-visible md:border-0 md:bg-transparent md:p-0 xl:row-span-1"
        >
          <h2 className="t-caption hidden px-2.5 pb-1.5 tracking-wider text-muted-foreground uppercase md:block">
            Seções
          </h2>
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              aria-current={activeSection === section.id ? 'true' : undefined}
              onClick={() => scrollTo(section.id)}
              className="t-label flex min-h-11 flex-none cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 text-left whitespace-nowrap text-neutral hover:bg-surface-muted hover:text-foreground aria-[current=true]:bg-surface aria-[current=true]:font-semibold aria-[current=true]:text-foreground aria-[current=true]:ring-1 aria-[current=true]:ring-border md:min-h-control-md"
            >
              {section.label}
              <SectionStatus state={sectionStates[section.id]} />
            </button>
          ))}
        </nav>

        <form
          id="partner-form"
          noValidate
          onSubmit={save}
          className="grid min-w-0 content-start gap-4"
        >
          {isSubmitted && errorCount > 0 ? (
            <Alert
              tone="danger"
              title={`Revise ${errorCount} ${errorCount === 1 ? 'campo' : 'campos'} antes de salvar.`}
            >
              Os campos com erro estão destacados em cada seção.
            </Alert>
          ) : null}
          {failure ? (
            <Alert
              tone={failure.conflict ? 'warning' : 'danger'}
              title={
                failure.conflict
                  ? 'Outra pessoa alterou este parceiro.'
                  : 'Não foi possível concluir a operação.'
              }
              action={
                failure.conflict ? (
                  <Button compact onClick={reload}>
                    Carregar versão atual
                  </Button>
                ) : undefined
              }
            >
              {failure.message}
              {failure.details.length > 0 ? (
                <ul className="mt-1 list-disc pl-5">
                  {failure.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </Alert>
          ) : null}

          <Section
            id="sec-main"
            title="Dados principais"
            description="Informações que identificam o parceiro no catálogo."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Nome do parceiro"
                frameClassName="md:col-span-2"
                autoComplete="organization"
                hint={
                  similar
                    ? `Já existe um parceiro chamado “${similar.name}”. Verifique se não é duplicidade.`
                    : undefined
                }
                error={fieldMessage(errors.name?.message)}
                {...register('name')}
              />
              <InputField
                label="Endereço público"
                frameClassName="md:col-span-2"
                optional={isNew}
                prefix="flexclube.org/parceiros/"
                mono
                hint={
                  isNew
                    ? 'Gerado a partir do nome quando vazio. Alterá-lo depois redireciona o endereço anterior.'
                    : 'Alterar o endereço redireciona permanentemente o anterior.'
                }
                error={fieldMessage(errors.slug?.message)}
                {...register('slug')}
              />
              <InputField
                label="Site"
                optional
                type="url"
                inputMode="url"
                error={fieldMessage(errors.website?.message)}
                {...register('website')}
              />
              <TextareaField
                label="Descrição"
                frameClassName="md:col-span-2"
                hint={
                  <span className="tnum">
                    {values.description.length.toLocaleString('pt-BR')} de 2.000
                    caracteres.
                  </span>
                }
                error={fieldMessage(errors.description?.message)}
                {...register('description')}
              />
              <TextareaField
                label="Instruções para usar o benefício"
                frameClassName="md:col-span-2"
                error={fieldMessage(errors.usageInstructions?.message)}
                {...register('usageInstructions')}
              />
            </div>
          </Section>

          <Section
            id="sec-cat"
            title="Categorias e contatos"
            description="Ao menos uma categoria ativa e um contato são necessários para publicar."
          >
            <div className="grid gap-5">
              <div className="grid gap-2">
                <span className="t-label" id="categories-label">
                  Categorias
                </span>
                {categories.length === 0 ? (
                  <p className="t-small muted">
                    Nenhuma categoria cadastrada. Cadastre categorias para
                    classificar o parceiro.
                  </p>
                ) : (
                  <Controller
                    control={control}
                    name="categoryIds"
                    render={({ field }) => (
                      <div
                        className="flex flex-wrap gap-1.5"
                        role="group"
                        aria-labelledby="categories-label"
                      >
                        {categories.map((category) => {
                          const selected = field.value.includes(category.id);
                          return (
                            <Chip
                              key={category.id}
                              pressed={selected}
                              disabled={
                                category.status === 'inactive' && !selected
                              }
                              {...(category.status === 'inactive'
                                ? { title: 'Categoria inativa' }
                                : {})}
                              onToggle={() =>
                                field.onChange(
                                  selected
                                    ? field.value.filter(
                                        (id) => id !== category.id,
                                      )
                                    : [...field.value, category.id],
                                )
                              }
                            >
                              {category.name}
                              {category.status === 'inactive'
                                ? ' (inativa)'
                                : ''}
                            </Chip>
                          );
                        })}
                      </div>
                    )}
                  />
                )}
                {rootMessage('categoryIds') ? (
                  <p className="t-caption text-danger">
                    {rootMessage('categoryIds')}
                  </p>
                ) : null}
              </div>
              <ContactsEditor
                path="contacts"
                title="Contatos gerais"
                rootError={rootMessage('contacts')}
              />
            </div>
          </Section>

          <Section
            id="sec-units"
            title="Unidades"
            description="Opcional. Unidades sem contato próprio exibem os contatos gerais."
          >
            <UnitsEditor />
          </Section>

          <Section
            id="sec-benefits"
            title="Benefícios e cupons"
            description="Um benefício por plano. O cupom do plano prevalece sobre o cupom geral."
          >
            <BenefitsEditor plans={plans} />
          </Section>

          <Section
            id="sec-publish"
            title="Publicação"
            description="Controle de exibição no catálogo público."
          >
            <Switch
              label="Destacar no catálogo"
              hint="Parceiros em destaque aparecem primeiro."
              {...register('featured')}
            />
          </Section>
        </form>

        <aside
          aria-label="Resumo do cadastro"
          className="grid content-start gap-3 md:col-start-2 md:grid-cols-2 xl:sticky xl:top-20 xl:col-start-3 xl:row-start-1 xl:grid-cols-1"
        >
          <section className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <h2 className="t-card">Situação</h2>
              <span
                className={`t-label inline-flex items-center gap-1.5 ${pendingChanges ? 'text-warning' : 'text-success'}`}
              >
                <span
                  className="size-1.5 rounded-full bg-current"
                  aria-hidden="true"
                />
                {pendingChanges ? 'Não salvo' : 'Salvo'}
              </span>
            </div>
            <dl className="border-t border-border px-4">
              {[
                [
                  'Estado',
                  <PartnerStatusBadge
                    key="status"
                    status={partner?.status ?? 'draft'}
                  />,
                ],
                ['Categorias', values.categoryIds.length],
                ['Unidades', values.units.length],
                [
                  'Benefícios',
                  `${enabledBenefits.length} ${enabledBenefits.length === 1 ? 'plano' : 'planos'}`,
                ],
              ].map(([term, detail]) => (
                <div
                  key={String(term)}
                  className="grid grid-cols-[110px_minmax(0,1fr)] items-baseline gap-3 border-b border-border py-2.5 last:border-b-0"
                >
                  <dt className="t-small muted">{term}</dt>
                  <dd className="t-label tnum">{detail}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-2 border-t border-border p-4">
              {canSave ? (
                <Button
                  type="submit"
                  form="partner-form"
                  variant="primary"
                  block
                  loading={create.isPending || replace.isPending}
                >
                  Salvar
                </Button>
              ) : null}
              {!isNew && canPublish && partner.status !== 'published' ? (
                <Button
                  block
                  disabled={!canRunPublish}
                  aria-describedby="publish-requirements"
                  loading={command.isPending}
                  onClick={() =>
                    run(
                      'publish',
                      partner.status === 'inactive'
                        ? 'Parceiro republicado.'
                        : 'Parceiro publicado.',
                    )
                  }
                >
                  {partner.status === 'inactive' ? 'Republicar' : 'Publicar'}
                </Button>
              ) : null}
              {!isNew && canPublish && partner.status === 'inactive' ? (
                <Button
                  block
                  disabled={busy || isDirty}
                  onClick={() =>
                    run('move-to-draft', 'Parceiro enviado para rascunho.')
                  }
                >
                  Enviar para rascunho
                </Button>
              ) : null}
              {!isNew && canPublish && partner.status === 'published' ? (
                <Button
                  variant="danger"
                  block
                  disabled={busy || isDirty}
                  onClick={() => setDeactivating(true)}
                >
                  Desativar
                </Button>
              ) : null}
            </div>
          </section>

          {partner?.status !== 'published' ? (
            <section className="rounded-xl border border-border bg-surface shadow-sm">
              <div className="px-4 py-3.5">
                <h2 className="t-card">Para publicar</h2>
              </div>
              <ul
                id="publish-requirements"
                className="border-t border-border px-4 py-2"
              >
                {requirements.map((requirement) => (
                  <li
                    key={requirement.label}
                    className="t-small flex items-start gap-2 py-1.5"
                  >
                    <Icon
                      name={requirement.met ? 'check' : 'x'}
                      className={
                        requirement.met
                          ? 'mt-0.5 text-success'
                          : 'mt-0.5 text-muted-foreground'
                      }
                    />
                    <span className={requirement.met ? '' : 'muted'}>
                      {requirement.label}
                      <span className="sr-only">
                        {requirement.met ? ': atendido' : ': pendente'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {deactivating && partner ? (
        <ConfirmDialog
          title={`Desativar ${partner.name}?`}
          body="O parceiro deixa de aparecer no catálogo imediatamente. Dados, unidades e benefícios são preservados e ele pode ser republicado."
          confirmLabel="Desativar"
          onCancel={() => setDeactivating(false)}
          onConfirm={() => {
            setDeactivating(false);
            run('deactivate', `${partner.name} desativado.`);
          }}
        />
      ) : null}

      {blocker.status === 'blocked' ? (
        <ConfirmDialog
          title="Sair sem salvar?"
          body="As alterações feitas neste parceiro serão descartadas."
          confirmLabel="Descartar alterações"
          onCancel={() => blocker.reset()}
          onConfirm={() => blocker.proceed()}
        />
      ) : null}
    </FormProvider>
  );
}
