import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import type { RouterContext } from '../app/router';

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [{ title: 'Clube Flex' }] }),
  component: Root,
});

function Root() {
  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  );
}
