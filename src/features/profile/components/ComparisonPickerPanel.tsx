import { useState } from 'react'
import { InlineLoader } from '@/components/states/InlineLoader'
import { useDebounced } from '@/lib/useDebounced'
import type { ComparisonRow } from '../api'
import {
  useCreateComparison,
  useRefreshProPlayerStats,
  useRemoveComparison,
  useSearchProPlayers,
} from '../hooks'

const REGISTER = {
  self: { border: 'rgba(166,63,255,0.45)', title: '#eef0f9', loaderClass: 'text-astro-accent' },
  community: { border: 'rgba(56,189,248,0.5)', title: '#38bdf8', loaderClass: 'text-astro-cyan' },
} as const

/**
 * The real design (Astro App.dc.html) renders this inline, expanding in
 * the page below the cards it belongs to, not as a modal overlay: no
 * backdrop, no dialog semantics, just conditional content. Self picks
 * are purple, community nominations are cyan, matching "claim in
 * purple, nominate in cyan" from the design status doc.
 */
export function ComparisonPickerPanel({
  source,
  playerId,
  createdBy,
  subjectNickname,
  ownSelfClaims,
  onClose,
}: {
  source: 'self' | 'community'
  playerId: string
  createdBy: string
  subjectNickname: string
  ownSelfClaims: ComparisonRow[]
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  // The account's API-Football plan allows 100 requests/day: a search
  // per keystroke would burn through that in seconds.
  const debouncedQuery = useDebounced(query, 400)
  const { data: results = [], isFetching } = useSearchProPlayers(debouncedQuery)
  const refreshStats = useRefreshProPlayerStats()
  const createComparison = useCreateComparison(playerId)
  const removeComparison = useRemoveComparison(playerId)

  const atCap = source === 'self' && ownSelfClaims.length >= 3
  const register = REGISTER[source]
  const picking = refreshStats.isPending || createComparison.isPending
  const title = source === 'self' ? 'WHO DO YOU PLAY LIKE?' : `NOMINATE FOR ${subjectNickname.toUpperCase()}`
  const body =
    source === 'self'
      ? atCap
        ? "You've already got three. Drop one before you pick another."
        : "Pick a pro. The group gets a say on whether you're dreaming."
      : 'Your pick, not his. Everyone else votes on whether you got it right.'

  function pick(proPlayerId: string) {
    // Real stats land before the comparison exists, not after: fetch
    // them first so the card never shows blank apps/goals/assists for a
    // player the search already found.
    refreshStats.mutate(proPlayerId, {
      onSettled: () => {
        createComparison.mutate({ proPlayerId, source, createdBy }, { onSuccess: onClose })
      },
    })
  }

  return (
    <div
      className="mt-4 rounded-2xl p-6"
      style={{ background: '#111a33', border: `1.5px solid ${register.border}` }}
    >
      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-display text-[28px] leading-none" style={{ color: register.title }}>
          {title}
        </h3>
        <button type="button" onClick={onClose} className="text-xs font-bold text-astro-text-dim hover:text-astro-text">
          Close
        </button>
      </div>
      <p className="mb-5 text-sm text-astro-text-muted">{body}</p>

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
              <InlineLoader size={18} className={register.loaderClass} />
            </div>
          )}
          {!isFetching && debouncedQuery.trim().length >= 2 && results.length === 0 && (
            <p className="px-1 py-2 text-sm text-astro-text-dim">Nobody by that name yet.</p>
          )}
          <div className="flex flex-col gap-2">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={picking}
                onClick={() => pick(p.id)}
                className="flex items-center gap-3 rounded-xl bg-astro-surface-2 px-4 py-3 text-left hover:bg-white/[0.04] disabled:opacity-50"
              >
                {p.photo_url ? (
                  <img
                    src={p.photo_url}
                    alt=""
                    className="size-9 shrink-0 rounded-[9px] object-cover"
                    style={{ background: 'linear-gradient(150deg, #2c3c74, #131c3a)' }}
                  />
                ) : (
                  <div
                    className="size-9 shrink-0 rounded-[9px]"
                    style={{ background: 'linear-gradient(150deg, #2c3c74, #131c3a)' }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-astro-text">{p.name}</div>
                  <div className="text-xs text-astro-text-dim">{p.nationality ?? '—'} &middot; {p.role ?? '—'}</div>
                </div>
                {picking && <InlineLoader size={14} className={register.loaderClass} />}
              </button>
            ))}
          </div>
          {results.length > 0 && (
            <p className="mt-3 px-1 text-[11px] text-astro-text-dim">
              Stats are Premier League, 2022–2024 combined, as current as the free plan goes.
            </p>
          )}
        </>
      )}
    </div>
  )
}
