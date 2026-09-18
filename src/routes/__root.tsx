import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AstroBallDefs } from '@/components/states/AstroBallDefs'
import { NotFoundPage } from '@/components/states/NotFoundPage'

export const Route = createRootRoute({
  component: () => (
    <>
      <AstroBallDefs />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  ),
  notFoundComponent: NotFoundPage,
})
