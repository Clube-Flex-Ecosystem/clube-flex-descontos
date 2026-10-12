import { Suspense } from 'react';
import { Link } from '@tanstack/react-router';
import { useCan } from '../../auth';
import { buttonVariants } from '../../../shared/ui/button';
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
                            className={buttonVariants({ variant: 'primary' })}
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
