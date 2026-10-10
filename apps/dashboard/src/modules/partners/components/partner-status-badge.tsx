import type { PartnerStatus } from '@flex/contracts';
import { Badge } from '../../../shared/ui/badge';

const presentation: Record<
  PartnerStatus,
  { tone: 'success' | 'warning' | 'neutral'; label: string }
> = {
  published: { tone: 'success', label: 'Publicado' },
  draft: { tone: 'warning', label: 'Rascunho' },
  inactive: { tone: 'neutral', label: 'Desativado' },
};

export function PartnerStatusBadge({ status }: { status: PartnerStatus }) {
  const { tone, label } = presentation[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
