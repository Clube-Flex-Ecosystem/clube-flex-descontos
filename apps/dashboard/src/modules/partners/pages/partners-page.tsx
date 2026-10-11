import { Suspense } from 'react';
import { Link } from '@tanstack/react-router';
import { useCan } from '../../auth';
import { Icon } from '../../../shared/ui/icon';
import { ListSkeleton, PageHeader } from '../../../shared/ui/page-parts';
import { PartnersList } from '../components/partners-list';

/** Cabeçalho e composição da listagem de parceiros. */
export function PartnersPage() {
  const canCreate = useCan('partners.create');

  return (
    <>
      <PageHeader
        title="Parceiros"
        description="Estabelecimentos e profissionais exibidos no catálogo público."
        actions={
          canCreate ? (
            <Link
              to="/parceiros/novo"
              className="t-label inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary-edge bg-primary-raised px-3 whitespace-nowrap text-primary-foreground no-underline shadow-brand-raised hover:bg-primary-raised-hover md:min-h-control-md"
            >
              <Icon name="plus" />
              Novo parceiro
            </Link>
          ) : null
        }
      />

      <Suspense fallback={<ListSkeleton label="Carregando parceiros" />}>
        <PartnersList />
      </Suspense>
    </>
  );
}
