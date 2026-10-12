import {
    createFileRoute,
    type ErrorComponentProps,
} from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { PartnersPage } from '../../../modules/partners';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/parceiros/')({
    beforeLoad: ({ context }) =>
        requirePermission(context.session, 'partners.view'),
    head: () => ({ meta: [{ title: 'Parceiros — Clube Flex' }] }),
    component: PartnersPage,
    errorComponent: PartnersError,
});

function PartnersError({ error, reset }: ErrorComponentProps) {
    const queryErrorReset = useQueryErrorResetBoundary();

    return (
        <Alert
            tone="danger"
            title="Não foi possível carregar os parceiros."
            action={
                <Button
                    compact
                    onClick={() => {
                        queryErrorReset.reset();
                        reset();
                    }}
                >
                    <Icon name="refresh" />
                    Tentar novamente
                </Button>
            }
        >
            {describeError(error)}
        </Alert>
    );
}
