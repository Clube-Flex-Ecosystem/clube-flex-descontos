import type { AdminUser } from '@flex/contracts';
import { Badge } from '../../../shared/ui/badge';

export function UserStatusBadge({ status }: { status: AdminUser['status'] }) {
  return status === 'active' ? (
    <Badge tone="success" dot>
      Ativo
    </Badge>
  ) : (
    <Badge dot>Inativo</Badge>
  );
}

/** Situação do acesso: ativada, aguardando ativação ou com troca de senha pendente. */
export function UserAccessBadge({
  accessStatus,
}: {
  accessStatus: AdminUser['accessStatus'];
}) {
  if (accessStatus === 'pendingActivation') {
    return <Badge tone="info">Aguardando ativação</Badge>;
  }
  if (accessStatus === 'passwordChangeRequired') {
    return <Badge tone="warning">Troca de senha pendente</Badge>;
  }
  return <Badge>Ativado</Badge>;
}
