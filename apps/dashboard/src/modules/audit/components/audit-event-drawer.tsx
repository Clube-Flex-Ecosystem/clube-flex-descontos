import type { AdminUser, AuditEvent } from '@flex/contracts';
import { DefinitionList } from '../../../shared/ui/card';
import { DetailDrawer } from '../../../shared/ui/dialogs';
import { Icon } from '../../../shared/ui/icon';
import {
  auditActionLabel,
  formatAuditDate,
  presentAuditEvent,
} from '../audit-format';

/** Evento selecionado em dialog lateral somente leitura, com o antes e o depois. */
export function AuditEventDrawer({
  event,
  users,
  onClose,
}: {
  event: AuditEvent;
  /** Contas conhecidas, para exibir o nome do autor (como na tabela). */
  users: AdminUser[] | undefined;
  onClose: () => void;
}) {
  const author =
    users?.find((user) => user.id === event.actor.id)?.fullName ??
    event.actor.username;
  const view = presentAuditEvent(event);
  const affected =
    event.target.type === 'user' ? (event.target.label ?? '—') : '—';

  return (
    <DetailDrawer
      title={auditActionLabel(event.action)}
      description={formatAuditDate(event.occurredAt)}
      note={
        <>
          <Icon name="lock" size="sm" />
          Registro imutável
        </>
      }
      onClose={onClose}
    >
      <DefinitionList
        rows={[
          { label: 'Autor', value: author },
          { label: 'Usuário afetado', value: affected },
          { label: 'Objeto', value: view.object },
        ]}
      />
      <h3 className="t-heading">Alteração</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="t-body-small rounded-control bg-surface-muted p-2.5 text-foreground">
          <span className="t-overline mb-0.5 block text-muted-foreground">
            Anterior
          </span>
          {view.before.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="t-body-small rounded-control bg-success-soft p-2.5 text-foreground">
          <span className="t-overline mb-0.5 block text-muted-foreground">
            Novo
          </span>
          {view.after.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </DetailDrawer>
  );
}
