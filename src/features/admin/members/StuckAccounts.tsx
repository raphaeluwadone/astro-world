import { Dialog as DialogPrimitive } from 'radix-ui'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { confirmAction } from '@/components/dialogs/confirm'
import type { MemberRow, StuckAccount } from './api'
import { useLinkAccount, useStuckAccounts } from './hooks'

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })

/** Sign-ups that never picked a name. Linking one here does what the Join page would have done. */
export function StuckAccounts({ members }: { members: MemberRow[] }) {
  const { data: accounts = [] } = useStuckAccounts()
  const [picking, setPicking] = useState<StuckAccount | null>(null)
  if (accounts.length === 0) return null

  return (
    <section className="mb-5 rounded-[14px] border border-astro-amber/40 bg-astro-admin-card p-4">
      <h2 className="mb-1 text-[13px] font-extrabold uppercase tracking-[0.12em] text-astro-amber">Signed up, never joined ({accounts.length})</h2>
      <p className="mb-3 text-[12.5px] text-astro-text-muted">
        These accounts exist but aren&rsquo;t linked to a name, so the person only ever sees the Join page. Link them to their name and they go straight in.
      </p>
      <ul className="divide-y divide-white/[0.06]">
        {accounts.map((a) => (
          <li key={a.user_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-bold text-astro-text">{a.email}</span>
              <span className="text-[11.5px] text-astro-text-dim">Signed up {when(a.created_at)}</span>
            </span>
            <button
              type="button"
              onClick={() => setPicking(a)}
              className="rounded-[9px] border border-astro-cyan/50 px-3 py-1.5 text-[12.5px] font-extrabold text-astro-cyan hover:bg-astro-cyan/[0.08]"
            >
              Link to a name
            </button>
          </li>
        ))}
      </ul>
      <NamePicker account={picking} members={members} onClose={() => setPicking(null)} />
    </section>
  )
}

function NamePicker({ account, members, onClose }: { account: StuckAccount | null; members: MemberRow[]; onClose: () => void }) {
  const link = useLinkAccount()
  const [query, setQuery] = useState('')
  const free = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((m) => !m.claimed && !m.left_at && (!q || `${m.nickname} ${m.full_name}`.toLowerCase().includes(q)))
  }, [members, query])

  const choose = async (m: MemberRow) => {
    if (!account) return
    const ok = await confirmAction({
      eyebrow: 'Members',
      title: `Link to ${m.nickname}?`,
      body: `${account.email} will become ${m.nickname}'s account, with their history. This can't be undone from here.`,
      confirmLabel: 'Link account',
      tone: 'admin',
    })
    if (!ok) return
    link.mutate(
      { userId: account.user_id, playerId: m.id },
      {
        onSuccess: () => {
          toast.success(`Linked to ${m.nickname}. They can sign in now.`)
          setQuery('')
          onClose()
        },
      },
    )
  }

  return (
    <DialogPrimitive.Root open={account !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-[rgba(4,8,18,0.88)]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[80] flex max-h-[80vh] w-[calc(100%-48px)] max-w-[450px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[5px] border border-[rgba(56,189,248,0.5)] bg-[#0f1730] p-[26px] outline-none">
          <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-astro-cyan">Members</div>
          <DialogPrimitive.Title className="mb-1.5 font-display text-[28px] font-normal leading-none text-astro-text">Which name is theirs?</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mb-3 text-[13px] text-astro-text-muted">
            Only names nobody has claimed are shown. If theirs is missing, add them as a player first.
          </DialogPrimitive.Description>
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names"
            aria-label="Search names"
            className="mb-2 min-h-10 w-full rounded-[8px] border border-white/[0.1] bg-astro-admin-bg px-3 text-[13.5px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-cyan/60 focus:outline-none"
          />
          <ul className="min-h-0 flex-1 divide-y divide-white/[0.06] overflow-y-auto">
            {free.length === 0 && <li className="py-4 text-center text-[13px] text-astro-text-dim">No unclaimed names match.</li>}
            {free.map((m) => (
              <li key={m.id}>
                <button type="button" disabled={link.isPending} onClick={() => choose(m)} className="flex w-full items-baseline gap-2 px-1 py-2.5 text-left hover:bg-white/[0.04] disabled:opacity-50">
                  <span className="text-[14px] font-extrabold text-astro-text">{m.nickname}</span>
                  <span className="truncate text-[12px] text-astro-text-dim">{m.full_name}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <DialogPrimitive.Close className="rounded-[8px] px-3 py-2 text-[13px] font-bold text-astro-text-muted hover:text-astro-text">Cancel</DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
