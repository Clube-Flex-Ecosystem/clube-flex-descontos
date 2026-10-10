import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import type { RouterContext } from '../app/router';
import { defaultHead } from '../shared/utils/page-head';

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => defaultHead,
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
