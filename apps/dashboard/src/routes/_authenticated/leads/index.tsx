import {
    createFileRoute,
    type ErrorComponentProps,
} from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { LeadsPage } from '../../../modules/leads/pages/leads-page';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { requireAnyPermission } from '../../../shared/utils/route-guards';
export const Route = createFileRoute('/_authenticated/leads/')({
    beforeLoad: ({ context }) =>
        requireAnyPermission(context.session, [
            'leads.view-own',
            'leads.view-all',
        ]),
    head: () => ({ meta: [{ title: 'Leads | Clube Flex' }] }),
    component: LeadsPage,
    errorComponent: LeadsError,
});

function LeadsError({ error, reset }: ErrorComponentProps) {
    const queryErrorReset = useQueryErrorResetBoundary();

    return (
        <Alert
            tone="danger"
            title="Não foi possível carregar os leads."
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
