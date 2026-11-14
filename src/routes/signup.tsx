import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { authMessage, sendEmailCode, signUp } from '@/features/auth/api'
import { EmailCodeStep, GoogleButton } from '@/features/auth/AuthExtras'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from '@/features/auth/AuthLayout'

const schema = z.object({
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
      const result = await signUp(values)
      if (result.confirmationRequired) {
        setConfirmationRequired(true)
      } else {
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
    <AuthLayout subtitle="Create your account">
      <GoogleButton redirect="/join" onError={setFormError} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <button type="button" disabled={sending} onClick={sendCode} className="mt-3 w-full text-center text-xs font-semibold text-astro-accent disabled:opacity-50">
        {sending ? 'Sending…' : 'No password? Email me a code instead'}
      </button>
      <p className="mt-5 text-center text-xs text-astro-text-muted">
        Already have an account?{' '}
        <Link to="/login" search={{ view: 'signin' }} className="font-semibold text-astro-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
