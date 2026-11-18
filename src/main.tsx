import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { ConfirmHost } from '@/components/dialogs/confirm'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { reactErrorHandler, reportError, startMonitoring } from '@/lib/monitoring'
import './index.css'
import { router } from './router'

startMonitoring(router)

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => reportError(error, { query: query.queryKey }),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      reportError(error, { mutation: mutation.options.mutationKey })
      // Ade's page never gets a toast, even for its own failures: a tribute
      // that didn't post is handled inline on that page instead. See
      // src/features/memorial for where `silent` is set.
      if (mutation.meta?.silent) return
      toast.error(error instanceof Error ? error.message : 'Something went wrong.')
    },
  }),
})

createRoot(document.getElementById('root')!, {
  onUncaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster />
        <ConfirmHost />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
