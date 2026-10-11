import type { AuditEvent } from '@flex/contracts';
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
  onClose,
}: {
  event: AuditEvent;
  onClose: () => void;
}) {
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
          { label: 'Autor', value: event.actor.username },
          { label: 'Usuário afetado', value: affected },
          { label: 'Objeto', value: view.object },
        ]}
      />
      <h3 className="t-label font-semibold">Alteração</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="t-small rounded-md bg-danger-soft p-2.5 text-danger">
          <span className="t-caption mb-0.5 block font-semibold tracking-wider uppercase opacity-75">
            Anterior
          </span>
          {view.before.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="t-small rounded-md bg-success-soft p-2.5 text-success">
          <span className="t-caption mb-0.5 block font-semibold tracking-wider uppercase opacity-75">
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
