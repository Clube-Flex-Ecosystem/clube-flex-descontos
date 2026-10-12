import {
    createFileRoute,
    type ErrorComponentProps,
} from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { describeError } from '../../../shared/http/problem';
import { Icon } from '../../../shared/ui/icon';
import { UsersPage } from '../../../modules/users';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/usuarios/')({
    beforeLoad: ({ context }) =>
        requirePermission(context.session, 'users.view'),
    head: () => ({ meta: [{ title: 'Usuários — Clube Flex' }] }),
    component: UsersPage,
    errorComponent: UsersError,
});

function UsersError({ error, reset }: ErrorComponentProps) {
    const queryErrorReset = useQueryErrorResetBoundary();

    return (
        <Alert
            tone="danger"
            title="Não foi possível carregar os usuários."
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
