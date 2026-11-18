import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { authMessage, EMAIL_AUTH_ENABLED, sendEmailCode, signUp } from '@/features/auth/api'
import { checkGroupCode, groupCodeMemory } from '@/features/join/api'
import { EmailCodeStep, GoogleButton } from '@/features/auth/AuthExtras'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from '@/features/auth/AuthLayout'

const schema = z.object({
  code: z.string().trim().min(1, 'Enter the group code'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) throw redirect({ to: '/' })
  },
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [sending, setSending] = useState(false)
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const sendCode = async () => {
    setFormError(null)
    if (!(await trigger('email'))) return
    setSending(true)
    try {
      await sendEmailCode(getValues('email'), { createUser: true, redirect: '/join' })
      setCodeSent(true)
    } catch (err) {
      setFormError(authMessage(err))
    } finally {
      setSending(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    try {
      if (!(await checkGroupCode(values.code))) {
        setError('code', { message: 'That code isn’t right. Ask in the group chat.' })
        return
      }
      const result = await signUp(values)
      if (result.confirmationRequired) {
        setConfirmationRequired(true)
      } else {
        groupCodeMemory.set(values.code)
        await navigate({ to: '/join' })
      }
    } catch (err) {
      setFormError(authMessage(err))
    }
  }

  if (confirmationRequired) {
    return (
      <AuthLayout subtitle="Almost there">
        <p className="text-sm text-astro-text-muted">
          Check your email to confirm your account, then{' '}
          <Link to="/login" search={{ view: 'signin' }} className="font-semibold text-astro-accent">
            sign in
          </Link>
          .
        </p>
      </AuthLayout>
    )
  }

  if (codeSent) {
    return (
      <AuthLayout subtitle="Check your email">
        <EmailCodeStep email={getValues('email')} createUser redirect="/join" onDone={() => navigate({ to: '/join' })} onBack={() => setCodeSent(false)} />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout subtitle="Join the group">
      <GoogleButton redirect="/join" onError={setFormError} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">Group code</Label>
          <Input id="code" autoComplete="off" autoCapitalize="characters" autoCorrect="off" placeholder="From the group chat" {...register('code')} />
          {errors.code && <p className="text-xs text-astro-red">{errors.code.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-astro-red">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="text-xs text-astro-red">{errors.password.message}</p>}
        </div>
        {formError && <p className="text-xs text-astro-red">{formError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Checking…' : 'Next: find your name'}
        </Button>
      </form>
      {EMAIL_AUTH_ENABLED && (
        <button type="button" disabled={sending} onClick={sendCode} className="mt-3 w-full text-center text-xs font-semibold text-astro-accent disabled:opacity-50">
          {sending ? 'Sending…' : 'No password? Get a 6-digit code by email.'}
        </button>
      )}
      <p className="mt-5 text-center text-xs text-astro-text-muted">
        Already have an account?{' '}
        <Link to="/login" search={{ view: 'signin' }} className="font-semibold text-astro-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
