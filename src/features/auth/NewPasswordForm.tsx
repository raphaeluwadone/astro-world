import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { authMessage, updatePassword } from './api'

const schema = z
  .object({ password: z.string().min(8, 'At least 8 characters'), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'The passwords don’t match', path: ['confirm'] })

type Values = z.infer<typeof schema>

export function NewPasswordForm({ submitLabel, onSaved }: { submitLabel: string; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async (v: Values) => {
    try {
      await updatePassword(v.password)
      reset()
      onSaved()
    } catch (err) {
      setError('root', { message: authMessage(err) })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput id="new-password" autoComplete="new-password" {...register('password')} />
        {errors.password && <p className="text-xs text-astro-red">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Type it again</Label>
        <PasswordInput id="confirm-password" autoComplete="new-password" {...register('confirm')} />
        {errors.confirm && <p className="text-xs text-astro-red">{errors.confirm.message}</p>}
      </div>
      {errors.root && <p className="text-xs text-astro-red">{errors.root.message}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
