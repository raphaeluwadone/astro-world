import { createRouter } from '@tanstack/react-router'
import { PageLoader } from '@/components/states/PageLoader'
import { RouteErrorPage } from '@/components/states/RouteErrorPage'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  // Pages download on first visit, so fetch the ones in view ahead of the tap and show a spinner early if one is still loading.
  defaultPreload: 'viewport',
  defaultPendingMs: 100,
  defaultPendingMinMs: 300,
  defaultPendingComponent: PageLoader,
  defaultErrorComponent: RouteErrorPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
