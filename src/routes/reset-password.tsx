import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { PageLoader } from '@/components/states/PageLoader'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { NewPasswordForm } from '@/features/auth/NewPasswordForm'
import { useSession } from '@/features/auth/session'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

// The reset email's link signs the player in for this one step.
function ResetPasswordPage() {
  const { session, loading } = useSession()
  const navigate = useNavigate()
  if (loading) return <PageLoader />
  if (!session)
    return (
      <AuthLayout subtitle="Link expired">
        <p className="text-sm text-astro-text-muted">This reset link has expired or was already used. Ask for a new one from the sign-in page.</p>
        <Link to="/login" search={{ view: 'signin' }} className="mt-5 block text-center text-sm font-semibold text-astro-accent">
          Back to sign in
        </Link>
      </AuthLayout>
    )
  return (
    <AuthLayout subtitle="Set a new password">
      <NewPasswordForm
        submitLabel="Save and sign in"
        onSaved={() => {
          toast.success('Password changed')
          navigate({ to: '/' })
        }}
      />
    </AuthLayout>
  )
}
