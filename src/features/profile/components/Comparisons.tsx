import { useState } from 'react'
import { useCastVote } from '../hooks'
import type { ComparisonRow } from '../api'
import { NominateComparisonModal } from './NominateComparisonModal'

function ComparisonCard({
  c,
  canVote,
  voterId,
  playerId,
}: {
  c: ComparisonRow
  canVote: boolean
  voterId: string | undefined
  playerId: string
}) {
  const net = c.upvotes - c.downvotes
  const castVote = useCastVote(playerId)

  function vote(direction: 'up' | 'down') {
    if (!voterId) return
    castVote.mutate({ comparisonId: c.id, voterId, direction: c.myVote === direction ? null : direction })
  }

  return (
    <div className="rounded-[14px] border border-border bg-astro-surface-2 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="size-12 shrink-0 rounded-[11px]"
          style={{ background: 'linear-gradient(150deg, #2c3c74, #131c3a)' }}
        />
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-extrabold text-astro-text">{c.pro.name}</div>
          <div className="text-[11.5px] text-astro-text-dim">
            {c.pro.nationality ?? '—'} &middot; {c.pro.role ?? '—'}
          </div>
        </div>
      </div>
      <div className="mb-3.5 flex gap-2">
        <div className="flex-1 rounded-lg bg-astro-bg px-2.5 py-2">
          <div className="text-[9px] font-extrabold tracking-[0.1em] text-astro-text-dim">APPS</div>
          <div className="font-display text-xl leading-[1.1] text-astro-text">{c.pro.apps ?? '—'}</div>
        </div>
        <div className="flex-1 rounded-lg bg-astro-bg px-2.5 py-2">
          <div className="text-[9px] font-extrabold tracking-[0.1em] text-astro-text-dim">GOALS</div>
          <div className="font-display text-xl leading-[1.1] text-astro-text">{c.pro.goals ?? '—'}</div>
        </div>
        <div className="flex-1 rounded-lg bg-astro-bg px-2.5 py-2">
          <div className="text-[9px] font-extrabold tracking-[0.1em] text-astro-text-dim">ASSISTS</div>
          <div className="font-display text-xl leading-[1.1] text-astro-text">{c.pro.assists ?? '—'}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canVote || castVote.isPending}
          onClick={() => vote('up')}
          className="flex min-h-9 items-center gap-[7px] rounded-[9px] border px-[11px] py-[7px] disabled:opacity-60"
          style={{
            background: '#0a0f1f',
            borderColor: c.myVote === 'up' ? '#4ade80' : 'rgba(74,222,128,0.34)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#4ade80">
            <path d="M12 3.4 21 13h-5.4v7.6H8.4V13H3Z" />
          </svg>
          <span className="text-[12.5px] font-extrabold text-astro-green">{c.upvotes}</span>
        </button>
        <button
          type="button"
          disabled={!canVote || castVote.isPending}
          onClick={() => vote('down')}
          className="flex min-h-9 items-center gap-[7px] rounded-[9px] border px-[11px] py-[7px] disabled:opacity-60"
          style={{
            background: '#0a0f1f',
            borderColor: c.myVote === 'down' ? '#e0483f' : 'rgba(224,72,63,0.34)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#e0483f">
            <path d="M12 20.6 3 11h5.4V3.4h7.2V11H21Z" />
          </svg>
          <span className="text-[12.5px] font-extrabold text-astro-red">{c.downvotes}</span>
        </button>
        <span className={`ml-auto font-display text-lg ${net >= 0 ? 'text-astro-accent' : 'text-astro-red'}`}>
          {net >= 0 ? '+' : ''}
          {net}
        </span>
      </div>
    </div>
  )
}

function ComparisonSection({
  title,
  titleColor,
  caption,
  description,
  comparisons,
  ctaLabel,
  special,
  onCta,
  canVote,
  voterId,
  playerId,
}: {
  title: string
  titleColor: string
  caption: string
  description: string
  comparisons: ComparisonRow[]
  ctaLabel: string
  special: boolean
  onCta?: () => void
  canVote: boolean
  voterId: string | undefined
  playerId: string
}) {
  const totalVotes = comparisons.reduce((sum, c) => sum + c.upvotes + c.downvotes, 0)
  return (
    <div
      className={
        special
          ? 'rounded-2xl border-[1.5px] border-[rgba(166,63,255,0.4)] bg-astro-surface p-6'
          : 'rounded-2xl border border-border bg-astro-surface p-6'
      }
    >
      <div className="mb-1.5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-[34px] leading-none" style={{ color: titleColor }}>
          {title}
        </h2>
        <div className="text-xs text-astro-text-dim">
          {caption} &middot; {totalVotes} votes cast
        </div>
      </div>
      <p className="mb-[18px] text-[13px] text-astro-text-muted">{description}</p>

      {comparisons.length === 0 ? (
        <p className="mb-4 text-sm text-astro-text-dim">Nothing here yet.</p>
      ) : (
        <div className="mb-4 grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))' }}>
          {comparisons.map((c) => (
            <ComparisonCard key={c.id} c={c} canVote={canVote} voterId={voterId} playerId={playerId} />
          ))}
        </div>
      )}

      {onCta && (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center gap-2 rounded-[11px] border border-dashed border-[rgba(166,63,255,0.4)] bg-astro-surface-2 px-4 py-[11px] text-[13px] font-bold text-astro-accent-soft hover:border-solid"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.5 3.2h3v7.3h7.3v3h-7.3v7.3h-3v-7.3H3.2v-3h7.3Z" />
          </svg>
          {ctaLabel}
        </button>
      )}
    </div>
  )
}

export function Comparisons({
  comparisons,
  playerId,
  isOwnProfile,
  currentPlayerId,
}: {
  comparisons: ComparisonRow[]
  playerId: string
  isOwnProfile: boolean
  currentPlayerId: string | undefined
}) {
  const [nominating, setNominating] = useState<'self' | 'community' | null>(null)
  const selfClaims = comparisons.filter((c) => c.source === 'self')
  // "Top three by net votes": community nominations aren't capped at
  // write time (unlike self-claims), so the ranking does the limiting.
  const communityPicks = comparisons
    .filter((c) => c.source === 'community')
    .sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
    .slice(0, 3)

  return (
    <div className="space-y-5">
      <ComparisonSection
        title="I Am Him"
        titleColor="#c589ff"
        caption="Own three"
        description="Who he reckons he plays like. The group gets a say on whether he's dreaming."
        comparisons={selfClaims}
        ctaLabel={selfClaims.length >= 3 ? 'Swap one out' : selfClaims.length === 0 ? 'Pick one' : 'Pick another'}
        special
        onCta={isOwnProfile ? () => setNominating('self') : undefined}
        canVote={!isOwnProfile && !!currentPlayerId}
        voterId={currentPlayerId}
        playerId={playerId}
      />
      <ComparisonSection
        title="You Are Him"
        titleColor="#eef0f9"
        caption="Group's three"
        description="Who the group actually thinks he plays like. Top three by net votes."
        comparisons={communityPicks}
        ctaLabel="Nominate someone else"
        special={false}
        onCta={!isOwnProfile ? () => setNominating('community') : undefined}
        canVote={!isOwnProfile && !!currentPlayerId}
        voterId={currentPlayerId}
        playerId={playerId}
      />

      {nominating && currentPlayerId && (
        <NominateComparisonModal
          open
          onOpenChange={(open) => !open && setNominating(null)}
          source={nominating}
          playerId={playerId}
          createdBy={currentPlayerId}
          ownSelfClaims={selfClaims}
        />
      )}
    </div>
  )
}
