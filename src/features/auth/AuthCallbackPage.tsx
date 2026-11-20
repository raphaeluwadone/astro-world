import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { PageLoader } from '@/components/states/PageLoader'
import { AuthLayout } from './AuthLayout'
import { useSession } from './session'

function linkError() {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search)
  return params.get('error_description')
}

/** Email links and Google land here; supabase-js reads the tokens from the URL, then we move on. */
export function AuthCallbackPage({ redirect }: { redirect?: string }) {
  const { session, loading } = useSession()
  const navigate = useNavigate()
  const [error, setError] = useState(linkError)

  useEffect(() => {
    if (session) navigate({ to: redirect ?? '/', replace: true })
  }, [session, redirect, navigate])

  useEffect(() => {
    if (loading || session || error) return
    const t = setTimeout(() => setError('That link didn’t work. It may have expired or already been used.'), 6000)
    return () => clearTimeout(t)
  }, [loading, session, error])

  if (!error) return <PageLoader />
  return (
    <AuthLayout subtitle="Couldn’t sign you in">
      <p className="text-sm text-astro-text-muted [text-wrap:pretty]">{error.replace(/\+/g, ' ')}</p>
      <Link to="/login" search={{ view: 'signin' }} className="mt-5 block text-center text-sm font-semibold text-astro-accent">
        Back to sign in
      </Link>
    </AuthLayout>
  )
}
