import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from 'cn'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateMember } from './hooks'

const POSITIONS = ['GK', 'DEF', 'ATT', 'UTIL'] as const
const INPUT =
  'min-h-10 w-full rounded-[8px] border border-white/[0.1] bg-astro-admin-bg px-3 text-[13.5px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-cyan/60 focus:outline-none'

/** Adds a player with no account yet; they claim the record when they join. */
export function AddMemberDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: (id: string) => void }) {
  const create = useCreateMember()
  const [nickname, setNickname] = useState('')
  const [fullName, setFullName] = useState('')
  const [positions, setPositions] = useState<(typeof POSITIONS)[number][]>([])
  const reset = () => {
    setNickname('')
    setFullName('')
    setPositions([])
  }

  const submit = () =>
    create.mutate(
      { nickname, fullName, positions },
      {
        onSuccess: (id) => {
          toast.success(`${nickname.trim()} added. They can claim the record when they join.`)
          reset()
          onOpenChange(false)
          onCreated(id)
        },
        onError: (e) => toast.error(/duplicate|unique/i.test(String((e as { message?: string }).message)) ? 'Someone already has that nickname.' : 'Couldn’t add them. Try again.'),
      },
    )

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-[rgba(4,8,18,0.88)]" style={{ animation: 'md-backdrop 140ms ease both' }} />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-48px)] max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-[5px] border border-[rgba(56,189,248,0.5)] bg-[#0f1730] p-[26px] outline-none"
          style={{ animation: 'md-admin 140ms ease both' }}
        >
          <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-astro-cyan">Members</div>
          <DialogPrimitive.Title className="mb-1.5 font-display text-[28px] font-normal leading-none text-astro-text">Add a player</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mb-4 text-[13px] text-astro-text-muted">
            For someone who plays but hasn&rsquo;t signed up. Their record is ready to claim when they do.
          </DialogPrimitive.Description>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (nickname.trim() && fullName.trim()) submit()
            }}
          >
            <input autoFocus className={INPUT} placeholder="Nickname" aria-label="Nickname" maxLength={30} value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <input className={INPUT} placeholder="Full name" aria-label="Full name" maxLength={60} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div className="flex gap-1.5">
              {POSITIONS.map((p) => {
                const on = positions.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPositions(on ? positions.filter((x) => x !== p) : [...positions, p])}
                    className={cn(
                      'min-h-9 flex-1 rounded-[8px] border text-xs font-extrabold',
                      on ? 'border-astro-cyan/60 bg-astro-cyan/[0.12] text-astro-text' : 'border-white/[0.1] text-astro-text-dim hover:text-astro-text',
                    )}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <DialogPrimitive.Close className="rounded-[8px] px-3 py-2 text-[13px] font-bold text-astro-text-muted hover:text-astro-text">Cancel</DialogPrimitive.Close>
              <button
                type="submit"
                disabled={!nickname.trim() || !fullName.trim() || create.isPending}
                className="rounded-[8px] bg-astro-cyan px-4 py-2 text-[13px] font-extrabold text-[#04121d] disabled:opacity-40"
              >
                {create.isPending ? 'Adding…' : 'Add player'}
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
