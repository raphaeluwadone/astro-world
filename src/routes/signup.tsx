import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp } from '@/features/auth/api'
import { AuthLayout } from '@/features/auth/AuthLayout'

const schema = z.object({
  nickname: z.string().min(1, 'Everyone needs a nickname').max(40),
  fullName: z.string().min(1, 'Enter your full name').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    try {
      const result = await signUp(values)
      if (result.confirmationRequired) {
        setConfirmationRequired(true)
      } else {
        await navigate({ to: '/' })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (confirmationRequired) {
    return (
      <AuthLayout title="ASTRO" subtitle="Almost there">
        <p className="text-sm text-astro-text-muted">
          Check your email to confirm your account, then{' '}
          <Link to="/login" className="font-semibold text-astro-accent">
            sign in
          </Link>
          .
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="ASTRO" subtitle="Create your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nickname">Nickname</Label>
          <Input id="nickname" autoComplete="nickname" {...register('nickname')} />
          {errors.nickname && <p className="text-xs text-astro-red">{errors.nickname.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-astro-red">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-astro-red">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="text-xs text-astro-red">{errors.password.message}</p>}
        </div>
        {formError && <p className="text-xs text-astro-red">{formError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-5 text-center text-xs text-astro-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-astro-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
