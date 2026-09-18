import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { JoinPage } from '@/features/join/JoinPage'

export const Route = createFileRoute('/join')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      throw redirect({ to: '/login', search: { redirect: '/join' } })
    }
  },
  component: JoinPage,
})
