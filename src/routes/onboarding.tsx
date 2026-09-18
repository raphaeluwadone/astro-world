import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      throw redirect({ to: '/login', search: { redirect: '/onboarding' } })
    }
  },
  component: OnboardingPage,
})
