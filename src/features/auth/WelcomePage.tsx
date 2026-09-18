import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from './AuthLayout'
import { signIn } from './api'
import { usePublicRosterSize } from './hooks'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

type FormValues = z.infer<typeof schema>

export function WelcomePage({
  redirectTo,
  initialView = 'landing',
}: {
  redirectTo?: string
  initialView?: 'landing' | 'signin'
}) {
  const [view, setView] = useState(initialView)

  if (view === 'signin') {
    return <SignInForm onBack={() => setView('landing')} redirectTo={redirectTo} />
  }
  return <LandingHero onSignIn={() => setView('signin')} />
}

function LandingHero({ onSignIn }: { onSignIn: () => void }) {
  const { data: rosterSize } = usePublicRosterSize()

  return (
    <div className="flex min-h-screen flex-col items-center bg-astro-bg px-5 py-9 pb-[70px]">
      <div className="w-full max-w-[560px]">
        <div className="mb-[30px] flex justify-center">
          <svg width="72" height="72" viewBox="0 0 100 100">
            <use href="#astro-ball" />
          </svg>
        </div>

        <div className="mb-[30px] text-center">
          <div className="mb-3 font-display text-[76px] leading-[0.9] tracking-[0.07em] text-astro-text">ASTRO</div>
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

function SignInForm({ onBack, redirectTo }: { onBack: () => void; redirectTo?: string }) {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    try {
      await signIn(values)
      await navigate({ to: redirectTo ?? '/' })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <AuthLayout title="ASTRO" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-astro-red">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <p className="text-xs text-astro-red">{errors.password.message}</p>}
        </div>
        {formError && <p className="text-xs text-astro-red">{formError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="mt-5 w-full text-center text-xs font-semibold text-astro-text-muted hover:text-astro-text"
      >
        &larr; Back
      </button>
    </AuthLayout>
  )
}
