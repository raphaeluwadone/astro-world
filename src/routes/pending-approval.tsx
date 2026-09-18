import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { PendingApprovalPage } from '@/features/join/PendingApprovalPage'

export const Route = createFileRoute('/pending-approval')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      throw redirect({ to: '/login', search: { redirect: '/pending-approval' } })
    }
  },
  component: PendingApprovalPage,
})
