import { createFileRoute } from '@tanstack/react-router'
import { PayReturnPage } from '@/features/payments/PayReturnPage'

export const Route = createFileRoute('/_app/pay/return')({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search.reference === 'string' ? search.reference : undefined,
  }),
  component: PayReturnPage,
})
