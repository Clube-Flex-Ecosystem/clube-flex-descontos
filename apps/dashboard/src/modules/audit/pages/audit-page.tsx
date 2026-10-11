import { Suspense, useState } from 'react';
import { PageHeader, ListSkeleton } from '../../../shared/ui/page-parts';
import { AuditList, getAuditPeriodStart } from '../components/audit-list';

/** Cabeçalho e composição da consulta de auditoria. */
export function AuditPage() {
  // Fica acima do boundary: o valor não é recriado quando a lista suspende.
  const [initialSince] = useState(() => getAuditPeriodStart('30d'));

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Registro imutável de operações administrativas sensíveis."
      />
      <Suspense fallback={<ListSkeleton label="Carregando eventos" />}>
        <AuditList initialSince={initialSince} />
      </Suspense>
    </>
  );
}
