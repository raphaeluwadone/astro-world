import { useState } from 'react'
import { toast } from 'sonner'
import { NewPasswordForm } from '@/features/auth/NewPasswordForm'

export function PasswordCard() {
  const [open, setOpen] = useState(false)
  return (
    <div className="astro-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="mb-1 font-display text-[28px] leading-none text-astro-text">Password</h2>
          <p className="text-xs text-astro-text-dim">Signed in with Google or a code? Set one here to use a password too.</p>
        </div>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-[10px] border border-white/[0.12] px-3 py-2 text-xs font-bold text-astro-text hover:border-astro-accent/50">
            Change
          </button>
        )}
      </div>
      {open && (
        <div className="mt-4">
          <NewPasswordForm
            submitLabel="Save password"
            onSaved={() => {
              setOpen(false)
              toast.success('Password changed')
            }}
          />
          <button type="button" onClick={() => setOpen(false)} className="mt-3 w-full text-center text-xs font-semibold text-astro-text-muted hover:text-astro-text">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
