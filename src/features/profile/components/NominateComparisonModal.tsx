import { useState } from 'react'
import { MemberModal } from '@/components/dialogs/MemberModal'
import { InlineLoader } from '@/components/states/InlineLoader'
import type { ComparisonRow } from '../api'
import { useCreateComparison, useRemoveComparison, useSearchProPlayers } from '../hooks'

const COPY = {
  self: {
    title: 'WHO DO YOU PLAY LIKE?',
    body: "Pick a pro. The group gets a say on whether you're dreaming.",
    capBody: "You've already got three. Drop one before you pick another.",
  },
  community: {
    title: 'WHO DOES HE PLAY LIKE?',
    body: 'Your pick, not his. Everyone else votes on whether you got it right.',
    capBody: '',
  },
} as const

export function NominateComparisonModal({
  open,
  onOpenChange,
  source,
  playerId,
  createdBy,
  ownSelfClaims,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: 'self' | 'community'
  playerId: string
  createdBy: string
  ownSelfClaims: ComparisonRow[]
}) {
  const [query, setQuery] = useState('')
  const { data: results = [], isFetching } = useSearchProPlayers(query)
  const createComparison = useCreateComparison(playerId)
  const removeComparison = useRemoveComparison(playerId)

  const atCap = source === 'self' && ownSelfClaims.length >= 3
  const copy = COPY[source]

  function pick(proPlayerId: string) {
    createComparison.mutate(
      { proPlayerId, source, createdBy },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <MemberModal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setQuery('')
      }}
      title={copy.title}
      body={atCap ? copy.capBody : copy.body}
    >
      {atCap ? (
        <div className="flex flex-col gap-2">
          {ownSelfClaims.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-astro-surface-2 px-4 py-3">
              <span className="text-sm font-bold text-astro-text">{c.pro.name}</span>
              <button
                type="button"
                disabled={removeComparison.isPending}
                onClick={() => removeComparison.mutate(c.id)}
                className="text-xs font-bold text-astro-red hover:text-[#ff7a70]"
              >
                Drop
              </button>
            </div>
          ))}
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a pro"
            autoFocus
            className="mb-3 w-full rounded-xl border border-border bg-astro-surface-2 px-4 py-3 text-sm text-astro-text placeholder:text-astro-text-dim focus:outline-none"
          />
          {isFetching && (
            <div className="flex justify-center py-3">
              <InlineLoader size={18} className="text-astro-accent" />
            </div>
          )}
          {!isFetching && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-1 py-2 text-sm text-astro-text-dim">Nobody by that name yet.</p>
          )}
          <div className="flex flex-col gap-2">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={createComparison.isPending}
                onClick={() => pick(p.id)}
                className="flex items-center justify-between gap-3 rounded-xl bg-astro-surface-2 px-4 py-3 text-left hover:bg-astro-accent/10 disabled:opacity-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-astro-text">{p.name}</div>
                  <div className="text-xs text-astro-text-dim">{p.nationality ?? '—'} &middot; {p.role ?? '—'}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </MemberModal>
  )
}
