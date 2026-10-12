import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppShell } from '../../app/app-shell';
import { sessionQueryOptions } from '../../modules/auth/queries/session.query';

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: async ({ context }) => {
        const state =
            await context.queryClient.ensureQueryData(sessionQueryOptions);
        if (!state) throw redirect({ to: '/login' });
        return { session: state.session };
    },
    component: Authenticated,
});

function Authenticated() {
    const { session } = Route.useRouteContext();
    // As permissões são atualizadas quando a aba volta ao foco, sem polling contínuo.
    const { data } = useQuery(sessionQueryOptions);
    return <AppShell session={data?.session ?? session} />;
}
