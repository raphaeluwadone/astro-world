import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { DevSwitcher } from '@/features/auth/dev'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AstroBallDefs } from '@/components/states/AstroBallDefs'
import { NotFoundPage } from '@/components/states/NotFoundPage'
import { OfflineBanner } from '@/components/layout/OfflineBanner'

export const Route = createRootRoute({
  component: () => (
    <>
      <AstroBallDefs />
      <Outlet />
      <OfflineBanner />
      {DevSwitcher && (
        <Suspense fallback={null}>
          <DevSwitcher />
        </Suspense>
      )}
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  ),
  notFoundComponent: NotFoundPage,
})
