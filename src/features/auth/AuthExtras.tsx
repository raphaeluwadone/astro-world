import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authMessage, GOOGLE_ENABLED, sendEmailCode, signInWithGoogle, verifyEmailCode } from './api'

export function OrDivider() {
  return (
    <div className="my-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-astro-text-dim">
      <span className="h-px flex-1 bg-white/[0.08]" />
      or
      <span className="h-px flex-1 bg-white/[0.08]" />
    </div>
  )
}

const GOOGLE_G = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5Z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5Z" />
  </svg>
)

/** Hidden until VITE_AUTH_GOOGLE is set, so it never shows while the provider isn't configured. */
export function GoogleButton({ redirect, onError }: { redirect?: string; onError: (msg: string) => void }) {
  const [busy, setBusy] = useState(false)
  if (!GOOGLE_ENABLED) return null
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await signInWithGoogle(redirect)
          } catch (err) {
            onError(authMessage(err))
            setBusy(false)
          }
        }}
        className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-[10px] border border-white/[0.14] bg-white/[0.04] text-sm font-bold text-astro-text hover:bg-white/[0.08] disabled:opacity-50"
      >
        {GOOGLE_G}
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>
      <OrDivider />
    </>
  )
}

const RESEND_AFTER = 60

/** After a code is sent: type the 6 digits, or tap the link in the same email. */
export function EmailCodeStep({
  email,
  createUser,
  redirect,
  onDone,
  onBack,
}: {
  email: string
  createUser: boolean
  redirect?: string
  onDone: () => void
  onBack: () => void
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(RESEND_AFTER)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const verify = async (token: string) => {
    setBusy(true)
    setError(null)
    try {
      await verifyEmailCode(email, token)
      onDone()
    } catch (err) {
      setError(authMessage(err))
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-astro-text-muted [text-wrap:pretty]">
        We emailed a 6-digit code to <span className="font-bold text-astro-text">{email}</span>. Type it here, or tap the link in the same email.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (code.length === 6) verify(code)
          else setError('Enter the 6-digit code.')
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(next)
              setError(null)
              if (next.length === 6) verify(next)
            }}
            className="text-center font-display text-[26px] tracking-[0.4em]"
          />
          {error && <p className="text-xs text-astro-red">{error}</p>}
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Checking…' : 'Sign in'}
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-xs">
        <button type="button" onClick={onBack} className="font-semibold text-astro-text-muted hover:text-astro-text">
          &larr; Back
        </button>
        <button
          type="button"
          disabled={wait > 0}
          onClick={async () => {
            setError(null)
            try {
              await sendEmailCode(email, { createUser, redirect })
              setWait(RESEND_AFTER)
            } catch (err) {
              setError(authMessage(err))
            }
          }}
          className="font-semibold text-astro-accent disabled:text-astro-text-dim"
        >
          {wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
