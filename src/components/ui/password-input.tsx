import { cn } from 'cn'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { Input } from './input'

export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <Input type={shown ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-astro-text-muted hover:text-astro-text"
      >
        {shown ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  )
}
