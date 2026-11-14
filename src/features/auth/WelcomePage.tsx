import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { JoinBackdrop } from '@/components/layout/JoinBackdrop'
import { BrandMarkIcon } from '@/components/icons/nav-icons'
import { Wordmark } from '@/components/icons/Wordmark'
import { getRememberMe, setRememberMe } from '@/lib/supabase'
import { AuthLayout } from './AuthLayout'
import { authMessage, sendEmailCode, sendResetLink, signIn } from './api'
import { EmailCodeStep, GoogleButton } from './AuthExtras'
import { usePublicRosterSize } from './hooks'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

type FormValues = z.infer<typeof schema>

export const LEFT_NOTICE = 'This account is switched off because you’ve left Astro. Ask an admin if you’re coming back.'

export function WelcomePage({
  redirectTo,
  initialView = 'landing',
  notice,
}: {
  redirectTo?: string
  initialView?: 'landing' | 'signin'
  notice?: string
}) {
  const [view, setView] = useState(initialView)

  if (view === 'signin') {
    return <SignInForm onBack={() => setView('landing')} redirectTo={redirectTo} notice={notice} />
  }
  return <LandingHero onSignIn={() => setView('signin')} />
}

function LandingHero({ onSignIn }: { onSignIn: () => void }) {
  const { data: rosterSize } = usePublicRosterSize()

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-astro-bg px-5 py-9 pb-[70px]">
      <JoinBackdrop />
      <div className="relative z-[1] w-full max-w-[560px]" style={{ animation: 'jn-in 540ms cubic-bezier(.2,.8,.2,1) both' }}>
        <div className="relative mx-auto mb-[26px] flex size-[72px] items-center justify-center">
          <svg className="absolute inset-0" width="72" height="72" viewBox="0 0 24 24" style={{ animation: 'jn-spin 46s linear infinite' }}>
            <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(166,63,255,0.45)" strokeWidth={0.6} />
            <path d="M12 1 12 23M1 12h22M4 4l16 16M20 4 4 20" stroke="rgba(166,63,255,0.2)" strokeWidth={0.5} />
          </svg>
          <BrandMarkIcon className="absolute h-11 w-auto" />
        </div>

        <div className="mb-[30px] text-center">
          <Wordmark size={76} className="mb-3 justify-center text-astro-text" />
          <p className="mx-auto max-w-[40ch] text-base leading-[1.55] text-astro-text [text-wrap:pretty]">
            Sunday football at Gbaja Boys. Thirty spots, balloted every Wednesday, and nobody knows who
            they&rsquo;re playing with until the draw.
          </p>
        </div>

        <div className="mb-[22px] flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onSignIn}
            className="flex items-center gap-3.5 rounded-[13px] bg-astro-accent px-[22px] py-[18px] text-left hover:bg-astro-accent-soft"
          >
            <div className="min-w-0 flex-1">
              <div className="font-display text-2xl leading-none text-astro-on-accent">I&rsquo;M ALREADY IN</div>
              <div className="text-[12.5px] font-bold text-astro-on-accent">Sign in with your email</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-astro-on-accent">
              <path d="M8.4 3.6 16.8 12l-8.4 8.4Z" />
          </svg>
          </button>
          <Link
            to="/signup"
            className="flex items-center gap-3.5 rounded-[13px] border-[1.5px] border-[rgba(166,63,255,0.4)] bg-astro-surface px-[22px] py-[18px] text-left no-underline hover:border-astro-accent"
          >
            <div className="min-w-0 flex-1">
              <div className="font-display text-2xl leading-none text-astro-accent-soft">I&rsquo;M NEW HERE</div>
              <div className="text-[12.5px] text-astro-text-muted">Find yourself in the records, or start fresh</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#c589ff" className="shrink-0">
              <path d="M8.4 3.6 16.8 12l-8.4 8.4Z" />
          </svg>
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2.5">
          <div className="astro-card p-3.5">
            <div className="font-display text-3xl leading-none text-astro-text">{rosterSize ?? '—'}</div>
            <div className="mt-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-muted">
              In the group
            </div>
          </div>
          <div className="astro-card p-3.5">
            <div className="font-display text-3xl leading-none text-astro-text">30</div>
            <div className="mt-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-muted">
              Play Sunday
            </div>
          </div>
          <div className="astro-card p-3.5">
            <div className="font-display text-3xl leading-none text-astro-text">09:30</div>
            <div className="mt-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-muted">
              Kick-off
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-astro-surface p-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#6d7496" className="mt-px shrink-0">
            <path
              fillRule="evenodd"
              d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm-1 4.6h2v2h-2Zm0 3.6h2v6.4h-2Z"
            />
          </svg>
          <p className="text-[12.5px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
            Everyone here goes by a nickname, so that&rsquo;s what you&rsquo;ll set up next if you&rsquo;re new.
            If you&rsquo;ve played before, you&rsquo;re probably already in our records under one.
          </p>
        </div>
      </div>
    </div>
  )
}

function SignInForm({ onBack, redirectTo, notice }: { onBack: () => void; redirectTo?: string; notice?: string }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<'password' | 'code' | 'forgot' | 'forgot-sent'>('password')
  const [formError, setFormError] = useState<string | null>(notice ?? null)
  const [sending, setSending] = useState(false)
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [remember, setRemember] = useState(getRememberMe)
  const done = () => navigate({ to: redirectTo ?? '/' })
  const toggleRemember = (on: boolean) => {
    setRemember(on)
    setRememberMe(on)
  }

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    try {
      await signIn(values)
      await done()
    } catch (err) {
      setFormError(authMessage(err))
    }
  }

  // Code and reset only need a valid email, not a password.
  const withEmail = async (send: (email: string) => Promise<void>, next: typeof step) => {
    setFormError(null)
    if (!(await trigger('email'))) return
    setSending(true)
    try {
      await send(getValues('email'))
      setStep(next)
    } catch (err) {
      setFormError(authMessage(err))
    } finally {
      setSending(false)
    }
  }

  if (step === 'code') {
    return (
      <AuthLayout subtitle="Check your email">
        <EmailCodeStep email={getValues('email')} createUser={false} redirect={redirectTo} onDone={done} onBack={() => setStep('password')} />
      </AuthLayout>
    )
  }

  if (step === 'forgot-sent') {
    return (
      <AuthLayout subtitle="Check your email">
        <p className="text-sm text-astro-text-muted [text-wrap:pretty]">
          If <span className="font-bold text-astro-text">{getValues('email')}</span> has an account, a link to set a new password is on its way.
        </p>
        <button type="button" onClick={() => setStep('password')} className="mt-5 w-full text-center text-xs font-semibold text-astro-text-muted hover:text-astro-text">
          &larr; Back to sign in
        </button>
      </AuthLayout>
    )
  }

  const forgot = step === 'forgot'
  return (
    <AuthLayout subtitle={forgot ? 'Reset your password' : 'Sign in to your account'}>
      {!forgot && <GoogleButton redirect={redirectTo} onError={setFormError} />}
      <form
        onSubmit={forgot ? (e) => (e.preventDefault(), withEmail(sendResetLink, 'forgot-sent')) : handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-astro-red">{errors.email.message}</p>}
        </div>
        {!forgot && (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" onClick={() => (setFormError(null), setStep('forgot'))} className="text-xs font-semibold text-astro-accent">
                Forgot password?
              </button>
            </div>
            <PasswordInput id="password" autoComplete="current-password" {...register('password')} />
            {errors.password && <p className="text-xs text-astro-red">{errors.password.message}</p>}
          </div>
        )}
        {!forgot && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-astro-text-muted">
            <input type="checkbox" checked={remember} onChange={(e) => toggleRemember(e.target.checked)} className="size-4 accent-astro-accent" />
            Remember me
          </label>
        )}
        {formError && <p className="text-xs text-astro-red">{formError}</p>}
        <Button type="submit" disabled={isSubmitting || sending} className="w-full">
          {forgot ? (sending ? 'Sending…' : 'Email me a reset link') : isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      {!forgot && (
        <button
          type="button"
          disabled={sending}
          onClick={() => withEmail((email) => sendEmailCode(email, { createUser: false, redirect: redirectTo }), 'code')}
          className="mt-3 w-full text-center text-xs font-semibold text-astro-accent disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Email me a sign-in code instead'}
        </button>
      )}
      <button
        type="button"
        onClick={forgot ? () => (setFormError(null), setStep('password')) : onBack}
        className="mt-5 w-full text-center text-xs font-semibold text-astro-text-muted hover:text-astro-text"
      >
        &larr; Back
      </button>
    </AuthLayout>
  )
}
