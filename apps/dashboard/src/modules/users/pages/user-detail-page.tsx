import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ACCESS_CODE_VALIDITY_MINUTES,
  permissions as allPermissions,
  updateUserRequestSchema,
  type AdminUser,
  type Permission,
} from '@flex/contracts';
import { useCan, useSession } from '../../auth';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { isVersionConflict } from '../../../shared/http/versioning';
import { Alert } from '../../../shared/ui/alert';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import {
  Card,
  CardStack,
  CardBody,
  CardHead,
  DefinitionList,
} from '../../../shared/ui/card';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import { InputField } from '../../../shared/ui/form-controls';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-parts';
import { initialsOf } from '../../../shared/utils/initials';
import {
  applyServerFieldErrors,
  fieldMessage,
} from '../../../shared/validation/server-errors';
import { PermissionGrid } from '../components/permission-grid';
import { UserAccessBadge, UserStatusBadge } from '../components/user-badges';
import { issuedCodeHandoff, type IssuedCodeNotice } from '../issued-code';
import {
  useIssueAccessCode,
  useReplacePermissions,
  useSetUserStatus,
  useUpdateUser,
} from '../mutations/users.mutations';
import { userQueryOptions } from '../queries/users.query';

const profileSchema = z.object({
  fullName: updateUserRequestSchema.shape.fullName,
  username: updateUserRequestSchema.shape.username,
  email: z
    .string()
    .trim()
    .max(254, { error: 'INVALID_VALUE' })
    .refine((value) => value === '' || z.email().safeParse(value).success, {
      error: 'INVALID_EMAIL',
    }),
});

type ProfileValues = z.infer<typeof profileSchema>;

const sameSet = (a: ReadonlySet<Permission>, b: readonly Permission[]) =>
  a.size === b.length && b.every((permission) => a.has(permission));

const toValues = (user: AdminUser): ProfileValues => ({
  fullName: user.fullName,
  username: user.username,
  email: user.email ?? '',
});

/** Detalhe de uma conta: os dados obrigatórios são carregados pela rota. */
export function UserDetailPage({ user }: { user: AdminUser }) {
  const query = useQuery({
    ...userQueryOptions(user.id),
    initialData: user,
    // A edição parte de uma versão fixa; alterações de terceiros surgem como conflito.
    refetchOnWindowFocus: false,
  });

  return (
    <UserDetail
      key={`${query.data.id}:${query.data.version}`}
      user={query.data}
      reload={async () => (await query.refetch()).data}
    />
  );
}

function UserDetail({
  user,
  reload,
}: {
  user: AdminUser;
  reload: () => Promise<AdminUser | undefined>;
}) {
  const session = useSession();
  const toast = useToast();
  const self = session?.user.id === user.id;
  const canManage = useCan('users.manage');
  const canSetStatus = useCan('users.set-status');
  const canReset = useCan('users.reset-access');
  const canGrant = useCan('permissions.manage');
  const own = new Set(session?.permissions ?? []);

  const update = useUpdateUser();
  const replace = useReplacePermissions();
  const setStatus = useSetUserStatus();
  const issue = useIssueAccessCode();

  const [grants, setGrants] = useState<Set<Permission>>(
    () => new Set(user.permissions),
  );
  const [failure, setFailure] = useState<{
    message: string;
    conflict: boolean;
  } | null>(null);
  const [issued, setIssued] = useState<IssuedCodeNotice | null>(() =>
    issuedCodeHandoff.peek(user.id),
  );
  const [confirm, setConfirm] = useState<'issue' | 'deactivate' | null>(null);

  // O código entregue pelo cadastro é consumido uma única vez, só em memória.
  useEffect(() => {
    issuedCodeHandoff.clear();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toValues(user),
  });

  const grantsChanged = !sameSet(grants, user.permissions);
  const dirty = isDirty || grantsChanged;
  const busy = update.isPending || replace.isPending;

  const syncFrom = (next: AdminUser) => {
    reset(toValues(next));
    setGrants(new Set(next.permissions));
  };

  const fail = (error: unknown) => {
    const applied = applyServerFieldErrors(error, setError, [
      'fullName',
      'username',
      'email',
    ]);
    if (!applied) {
      setFailure({
        message: describeError(error),
        conflict: isVersionConflict(error),
      });
    }
  };

  const save = handleSubmit(async (values) => {
    setFailure(null);
    let current = user;
    try {
      if (isDirty && canManage) {
        current = await update.mutateAsync({
          id: user.id,
          version: current.version,
          body: {
            fullName: values.fullName,
            username: values.username,
            ...(values.email ? { email: values.email } : {}),
          },
        });
        reset(toValues(current));
      }
      if (grantsChanged && canGrant && !self) {
        current = await replace.mutateAsync({
          id: user.id,
          version: current.version,
          permissions: [...grants],
        });
        setGrants(new Set(current.permissions));
      }
      toast('Usuário atualizado. Permissões já estão em vigor.');
    } catch (error) {
      fail(error);
    }
  });

  const discard = () => {
    setFailure(null);
    syncFrom(user);
  };

  const reconcile = async () => {
    setFailure(null);
    const fresh = await reload();
    if (fresh) syncFrom(fresh);
  };

  const toggleStatus = (next: 'active' | 'inactive') => {
    setFailure(null);
    setStatus.mutate(
      { id: user.id, version: user.version, status: next },
      {
        onSuccess: (saved) =>
          toast(
            `${saved.fullName} ${next === 'active' ? 'reativado' : 'desativado'}.`,
          ),
        onError: fail,
      },
    );
  };

  const activated = user.accessStatus !== 'pendingActivation';
  const purpose = activated ? 'recovery' : 'activation';
  const kind = purpose === 'recovery' ? 'recuperação' : 'ativação';

  const emitCode = () => {
    setFailure(null);
    issue.mutate(
      { id: user.id, purpose },
      {
        onSuccess: (saved) => {
          setIssued({
            userId: saved.id,
            purpose,
            delivery: saved.accessCodeDelivery ?? 'manual',
            ...(saved.accessCode ? { code: saved.accessCode } : {}),
            emailFailed:
              saved.warnings?.includes('EMAIL_DELIVERY_FAILED') ?? false,
          });
        },
        onError: fail,
      },
    );
  };

  const canEditSomething = canManage || (canGrant && !self);

  return (
    <>
      <PageHeader
        leading={
          <span
            className="t-heading grid size-10 flex-none place-items-center rounded-full bg-identity text-identity-foreground"
            aria-hidden="true"
          >
            {initialsOf(user.fullName)}
          </span>
        }
        title={self ? `${user.fullName} (você)` : user.fullName}
        description={user.username}
        monoDescription
        status={
          <span className="inline-flex gap-1.5">
            <UserStatusBadge status={user.status} />
            {user.accessStatus === 'pendingActivation' ? (
              <Badge tone="info">Aguardando ativação</Badge>
            ) : null}
          </span>
        }
        actions={
          canEditSomething ? (
            <>
              <Button onClick={discard} disabled={busy}>
                Descartar
              </Button>
              <Button
                variant="primary"
                loading={busy}
                disabled={!dirty}
                onClick={() => void save()}
              >
                Salvar alterações
              </Button>
            </>
          ) : null
        }
      />

      {failure ? (
        <div className="mb-3">
          <Alert
            tone={failure.conflict ? 'warning' : 'danger'}
            title={
              failure.conflict
                ? 'Outra pessoa alterou esta conta.'
                : 'Não foi possível concluir a operação.'
            }
            action={
              failure.conflict ? (
                <Button compact onClick={() => void reconcile()}>
                  <Icon name="refresh" />
                  Carregar versão atual
                </Button>
              ) : undefined
            }
          >
            {failure.message}
          </Alert>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CardStack>
          <Card>
            <CardHead title="Dados da conta" />
            <CardBody grid>
              <InputField
                label="Nome completo"
                readOnly={!canManage}
                error={fieldMessage(errors.fullName?.message)}
                {...register('fullName')}
              />
              <InputField
                label="Nome de usuário"
                mono
                readOnly={!canManage}
                error={fieldMessage(errors.username?.message)}
                {...register('username')}
              />
              <InputField
                label="E-mail"
                optional
                type="email"
                readOnly={!canManage}
                frameClassName="sm:col-span-2"
                error={fieldMessage(errors.email?.message)}
                {...register('email')}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHead
              title="Permissões"
              description="Concedidas individualmente. Alterações valem imediatamente, inclusive em sessões abertas."
              aside={
                <Badge tone="tag">
                  <span className="tnum">
                    {grants.size} de {allPermissions.length}
                  </span>
                </Badge>
              }
            />
            {self ? (
              <div className="mx-4 mt-3">
                <Alert tone="info">
                  <span className="inline-flex items-center gap-2">
                    <Icon name="lock" />
                    Você não pode alterar as próprias permissões.
                  </span>
                </Alert>
              </div>
            ) : null}
            <PermissionGrid
              granted={grants}
              canChange={(permission) =>
                canGrant && !self && own.has(permission)
              }
              onToggle={(permission, enabled) =>
                setGrants((current) => {
                  const next = new Set(current);
                  if (enabled) next.add(permission);
                  else next.delete(permission);
                  return next;
                })
              }
            />
          </Card>
        </CardStack>

        <CardStack>
          <Card>
            <CardHead title="Acesso" />
            <div className="grid gap-3 p-4">
              <DefinitionList
                rows={[
                  {
                    label: 'Situação',
                    value:
                      user.accessStatus === 'active' ? (
                        'Conta ativada'
                      ) : (
                        <UserAccessBadge accessStatus={user.accessStatus} />
                      ),
                  },
                  {
                    label: 'Estado',
                    value: <UserStatusBadge status={user.status} />,
                  },
                ]}
              />
              {issued && issued.delivery === 'manual' && issued.code ? (
                <div
                  className="grid gap-1 rounded-control bg-surface-muted p-3 text-center"
                  role="status"
                >
                  <span className="t-body-small muted">
                    Código de{' '}
                    {issued.purpose === 'recovery' ? 'recuperação' : 'ativação'}{' '}
                    · válido por {ACCESS_CODE_VALIDITY_MINUTES} min
                  </span>
                  <strong className="font-mono text-base font-normal tracking-widest">
                    {issued.code}
                  </strong>
                  <span className="t-body-small muted">
                    Entregue à pessoa por um canal seguro. Ele não será exibido
                    de novo.
                  </span>
                </div>
              ) : null}
              {issued && issued.delivery === 'email' ? (
                <Alert tone="success">
                  O código de{' '}
                  {issued.purpose === 'recovery' ? 'recuperação' : 'ativação'}{' '}
                  foi enviado para {user.email}.
                </Alert>
              ) : null}
              {issued?.emailFailed ? (
                <Alert tone="warning" title="O e-mail não pôde ser enviado.">
                  Entregue o código acima por outro canal seguro.
                </Alert>
              ) : null}
              {canReset ? (
                <>
                  <Button
                    disabled={user.status !== 'active'}
                    loading={issue.isPending}
                    onClick={() => setConfirm('issue')}
                  >
                    <Icon name="key" />
                    Emitir código de {kind}
                  </Button>
                  <p className="t-body-small muted">
                    Emitir um novo código invalida o anterior da mesma
                    finalidade.
                  </p>
                </>
              ) : null}
            </div>
          </Card>

          {canSetStatus ? (
            <Card>
              <CardHead
                title={
                  user.status === 'active'
                    ? 'Desativar conta'
                    : 'Reativar conta'
                }
                description={
                  user.status === 'active'
                    ? 'A pessoa perde o acesso imediatamente; históricos e leads são preservados.'
                    : 'A pessoa volta a poder entrar com a senha atual.'
                }
              />
              <div className="p-4">
                <Button
                  variant={
                    user.status === 'active' ? 'danger-quiet' : 'secondary'
                  }
                  disabled={self}
                  loading={setStatus.isPending}
                  title={
                    self
                      ? 'Você não pode desativar a própria conta.'
                      : undefined
                  }
                  onClick={() =>
                    user.status === 'active'
                      ? setConfirm('deactivate')
                      : toggleStatus('active')
                  }
                >
                  {user.status === 'active'
                    ? 'Desativar conta'
                    : 'Reativar conta'}
                </Button>
              </div>
            </Card>
          ) : null}
        </CardStack>
      </div>

      {confirm === 'issue' ? (
        <ConfirmDialog
          title={`Emitir código de ${kind}?`}
          body={
            purpose === 'recovery'
              ? `Qualquer código de recuperação anterior de ${user.fullName} deixará de funcionar. A senha atual deixa de permitir o acesso até que a pessoa defina uma nova com o código, que vale por ${ACCESS_CODE_VALIDITY_MINUTES} minutos e aceita até 5 tentativas.`
              : `Qualquer código de ativação anterior de ${user.fullName} deixará de funcionar. O novo código vale por ${ACCESS_CODE_VALIDITY_MINUTES} minutos e aceita até 5 tentativas.`
          }
          confirmLabel="Emitir código"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            emitCode();
          }}
        />
      ) : null}

      {confirm === 'deactivate' ? (
        <ConfirmDialog
          title={`Desativar ${user.fullName}?`}
          body="A pessoa perde o acesso imediatamente, inclusive em sessões abertas. Leads atribuídos e históricos são preservados."
          confirmLabel="Desativar conta"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            toggleStatus('inactive');
          }}
        />
      ) : null}
    </>
  );
}
