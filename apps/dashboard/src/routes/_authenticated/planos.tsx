import {
    createFileRoute,
    type ErrorComponentProps,
} from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { PlansPage } from '../../modules/plans/pages/plans-page';
import { describeError } from '../../shared/http/problem';
import { Alert } from '../../shared/ui/alert';
import { Button } from '../../shared/ui/button';
import { Icon } from '../../shared/ui/icon';
import { requirePermission } from '../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/planos')({
    beforeLoad: ({ context }) =>
        requirePermission(context.session, 'plans.view'),
    head: () => ({ meta: [{ title: 'Planos — Clube Flex' }] }),
    component: PlansPage,
    errorComponent: PlansError,
});

function PlansError({ error, reset }: ErrorComponentProps) {
    const queryErrorReset = useQueryErrorResetBoundary();

    return (
        <Alert
            tone="danger"
            title="Não foi possível carregar os planos."
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
