import {
    createFileRoute,
    redirect,
    type ErrorComponentProps,
} from '@tanstack/react-router';
import axios from 'axios';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { UserDetailPage } from '../../../modules/users';
import { userQueryOptions } from '../../../modules/users/queries/users.query';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/usuarios/$userId')({
    beforeLoad: ({ context }) =>
        requirePermission(context.session, 'users.view'),
    loader: async ({ params, context }) => {
        try {
            return {
                user: await context.queryClient.ensureQueryData(
                    userQueryOptions(params.userId),
                ),
            };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw redirect({ to: '/usuarios' });
            }
            throw error;
        }
    },
    head: ({ loaderData }) => ({
        meta: [
            { title: `${loaderData?.user.fullName ?? 'Usuário'} — Clube Flex` },
        ],
    }),
    component: UserRoute,
    errorComponent: UserError,
});

function UserRoute() {
    const { user } = Route.useLoaderData();
    return <UserDetailPage user={user} />;
}

function UserError({ error, reset }: ErrorComponentProps) {
    const queryErrorReset = useQueryErrorResetBoundary();

    return (
        <Alert
            tone="danger"
            title="Não foi possível carregar o usuário."
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
