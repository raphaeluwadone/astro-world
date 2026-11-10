import { MemberModal } from '@/components/dialogs/MemberModal'

const COPY = {
  claim: {
    title: 'Give up your spot?',
    body: 'Your spot goes back up for anyone to claim. If one is still free later, you can claim again.',
    confirm: 'Pull out',
    pending: 'Pulling out…',
    cancel: 'Stay in',
  },
  standby: {
    title: 'Leave standby?',
    body: 'You lose your place in the queue. Join again later and you go to the back.',
    confirm: 'Leave standby',
    pending: 'Leaving…',
    cancel: 'Stay on standby',
  },
} as const

export function PullOutDialog({
  kind,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  kind: keyof typeof COPY
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
}) {
  const copy = COPY[kind]
  return (
    <MemberModal open={open} onOpenChange={onOpenChange} title={copy.title} body={copy.body}>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          disabled={isPending}
          onClick={onConfirm}
          className="rounded-[11px] bg-astro-red px-5 py-3 text-[13px] font-extrabold text-white disabled:opacity-60"
        >
          {isPending ? copy.pending : copy.confirm}
        </button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-[11px] border border-white/[0.09] bg-astro-surface-2 px-5 py-3 text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
        >
          {copy.cancel}
        </button>
      </div>
    </MemberModal>
  )
}
