import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { getRememberMe, setRememberMe } from '@/lib/supabase'
import { AuthLayout } from './AuthLayout'
import { authMessage, EMAIL_AUTH_ENABLED, sendEmailCode, sendResetLink, signIn } from './api'
import { EmailCodeStep, GoogleButton } from './AuthExtras'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

type FormValues = z.infer<typeof schema>

export const LEFT_NOTICE = 'This account is switched off because you’ve left Astro. Ask an admin if you’re coming back.'

export function WelcomePage({ redirectTo, notice }: { redirectTo?: string; notice?: string }) {
  return <SignInForm redirectTo={redirectTo} notice={notice} />
}

function SignInForm({ redirectTo, notice }: { redirectTo?: string; notice?: string }) {
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
    <AuthLayout
      subtitle={forgot ? 'Reset your password' : 'Sunday football at Gbaja Boys'}
      footer={
        forgot ? undefined : (
          <div className="mt-4 rounded-2xl border border-[rgba(166,63,255,0.4)] bg-astro-surface p-5 text-center">
            <div className="font-display text-2xl leading-none text-astro-accent-soft">NEW HERE?</div>
            <p className="mb-3.5 mt-1.5 text-[12.5px] text-astro-text-muted">You need the group code. Then find your name on the list.</p>
            <Link to="/signup" className="flex min-h-11 items-center justify-center rounded-xl bg-astro-accent text-[14px] font-extrabold text-astro-on-accent no-underline hover:bg-astro-accent-soft">
              Find your name
            </Link>
          </div>
        )
      }
    >
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
              {EMAIL_AUTH_ENABLED && (
                <button type="button" onClick={() => (setFormError(null), setStep('forgot'))} className="text-xs font-semibold text-astro-accent">
                  Forgot password?
                </button>
              )}
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
      {!forgot && !EMAIL_AUTH_ENABLED && (
        <p className="mt-4 text-center text-xs text-astro-text-muted">Forgot your password? Ask an admin in the group chat.</p>
      )}
      {!forgot && EMAIL_AUTH_ENABLED && (
        <button
          type="button"
          disabled={sending}
          onClick={() => withEmail((email) => sendEmailCode(email, { createUser: false, redirect: redirectTo }), 'code')}
          className="mt-3 w-full text-center text-xs font-semibold text-astro-accent disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Email me a sign-in code instead'}
        </button>
      )}
      {forgot && (
        <button type="button" onClick={() => (setFormError(null), setStep('password'))} className="mt-5 w-full text-center text-xs font-semibold text-astro-text-muted hover:text-astro-text">
          &larr; Back
        </button>
      )}
    </AuthLayout>
  )
}
