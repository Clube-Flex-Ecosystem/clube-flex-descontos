import { Suspense, useState } from 'react';
import { useCan } from '../../auth';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { ListSkeleton, PageHeader } from '../../../shared/ui/page-parts';
import { LeadCreateDrawer } from '../components/lead-create-drawer';
import { LeadsList } from '../components/leads-list';

/** Cabeçalho e composição da página de pipeline. */
export function LeadsPage() {
    const canCreate = useCan('leads.create');
    const [creating, setCreating] = useState(false);

    return (
        <>
            <PageHeader
                title="Leads"
                description="Pipeline comercial dos contatos que você pode visualizar."
                actions={
                    canCreate ? (
                        <Button
                            variant="primary"
                            onClick={() => setCreating(true)}
                        >
                            <Icon name="plus" />
                            Novo lead
                        </Button>
                    ) : null
                }
            />

            <Suspense fallback={<ListSkeleton label="Carregando leads" />}>
                <LeadsList />
            </Suspense>

            {creating ? (
                <LeadCreateDrawer onClose={() => setCreating(false)} />
            ) : null}
        </>
    );
}
