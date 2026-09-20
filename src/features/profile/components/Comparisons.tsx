import { useState } from 'react'
import { useCastVote, useLastDropped } from '../hooks'
import type { ComparisonRow } from '../api'
import { ComparisonPickerPanel } from './ComparisonPickerPanel'

const DROP_THRESHOLD = 15
// Warn once a card is more than half way to the drop threshold, not
// only in the last vote or two: the point is to see it coming.
const RISK_THRESHOLD = 8
const ORDINALS = ['FIRST', 'SECOND', 'THIRD']

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
  const atRisk = net <= -RISK_THRESHOLD

  function vote(direction: 'up' | 'down') {
    if (!voterId) return
    castVote.mutate({ comparisonId: c.id, voterId, direction: c.myVote === direction ? null : direction })
  }

  return (
    <div className="rounded-[14px] border border-border bg-astro-surface-2 p-4">
      <div className="mb-3 flex items-center gap-3">
        {c.pro.photo_url ? (
          <img
            src={c.pro.photo_url}
            alt=""
            className="size-12 shrink-0 rounded-[11px] object-cover"
            style={{ background: 'linear-gradient(150deg, #2c3c74, #131c3a)' }}
          />
        ) : (
          <div
            className="size-12 shrink-0 rounded-[11px]"
            style={{ background: 'linear-gradient(150deg, #2c3c74, #131c3a)' }}
          />
        )}
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

      {atRisk && (
        <div className="mt-3.5 border-t border-[rgba(242,169,59,0.3)] pt-3">
          <div className="mb-2 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f2a93b" className="shrink-0">
              <path fillRule="evenodd" d="M12 2.4 22.4 20.8H1.6Zm-1 5.6h2v7h-2Zm0 9h2v2h-2Z" />
            </svg>
            <span className="text-[11.5px] font-extrabold text-[#f2a93b]">
              {Math.abs(net)} of {DROP_THRESHOLD} votes underwater
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-astro-bg">
            <div
              className="h-full rounded-full bg-[#f2a93b]"
              style={{ width: `${Math.min(100, (Math.abs(net) / DROP_THRESHOLD) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function EmptySlot({ ordinal, lastDropped }: { ordinal: string; lastDropped?: { name: string; droppedAt: string } | null }) {
  const droppedNote = lastDropped
    ? `${lastDropped.name} got voted off on ${new Date(lastDropped.droppedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. Pick someone else.`
    : 'Pick someone to fill it.'
  return (
    <div className="flex min-h-[190px] flex-col items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-[rgba(166,63,255,0.4)] bg-[#0d1428] p-4 text-center">
      <div className="flex size-[42px] items-center justify-center rounded-xl border border-[rgba(166,63,255,0.4)] bg-[rgba(166,63,255,0.14)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#c589ff">
          <path d="M10.5 3.2h3v7.3h7.3v3h-7.3v7.3h-3v-7.3H3.2v-3h7.3Z" />
        </svg>
      </div>
      <div>
        <div className="mb-1 font-display text-[22px] leading-none text-astro-accent-soft">{ordinal} SLOT FREE</div>
        <p className="mx-auto max-w-[26ch] text-[11.5px] leading-[1.45] text-astro-text-dim [text-wrap:pretty]">
          {droppedNote}
        </p>
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
  emptySlots,
  ctaLabel,
  ctaColor,
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
  emptySlots: { ordinal: string; lastDropped?: { name: string; droppedAt: string } | null }[]
  ctaLabel: string
  ctaColor?: string
  special?: boolean
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

      {comparisons.length === 0 && emptySlots.length === 0 ? (
        <p className="mb-4 text-sm text-astro-text-dim">Nothing here yet.</p>
      ) : (
        <div className="mb-4 grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))' }}>
          {comparisons.map((c) => (
            <ComparisonCard key={c.id} c={c} canVote={canVote} voterId={voterId} playerId={playerId} />
          ))}
          {emptySlots.map((slot) => (
            <EmptySlot key={slot.ordinal} ordinal={slot.ordinal} lastDropped={slot.lastDropped} />
          ))}
        </div>
      )}

      {onCta && (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center gap-2 rounded-[11px] border border-dashed px-4 py-[11px] text-[13px] font-bold hover:border-solid"
          style={{
            borderColor: ctaColor ? `${ctaColor}66` : 'rgba(166,63,255,0.4)',
            color: ctaColor ?? '#c589ff',
          }}
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
  subjectNickname,
  isOwnProfile,
  currentPlayerId,
}: {
  comparisons: ComparisonRow[]
  playerId: string
  subjectNickname: string
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

  const { data: lastDroppedSelf } = useLastDropped(playerId, 'self')

  const selfEmptySlots = ORDINALS.slice(selfClaims.length).map((ordinal, i) => ({
    ordinal,
    lastDropped: i === 0 ? lastDroppedSelf : null,
  }))

  return (
    <div className="space-y-5">
      <ComparisonSection
        title="I Am Him"
        titleColor="#c589ff"
        caption="Own three"
        description="Who he reckons he plays like. The group gets a say on whether he's dreaming."
        comparisons={selfClaims}
        emptySlots={isOwnProfile ? selfEmptySlots : []}
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
        emptySlots={[]}
        ctaLabel="Nominate someone else"
        ctaColor="#38bdf8"
        onCta={!isOwnProfile ? () => setNominating('community') : undefined}
        canVote={!isOwnProfile && !!currentPlayerId}
        voterId={currentPlayerId}
        playerId={playerId}
      />

      {nominating && currentPlayerId && (
        <ComparisonPickerPanel
          source={nominating}
          playerId={playerId}
          createdBy={currentPlayerId}
          subjectNickname={subjectNickname}
          ownSelfClaims={selfClaims}
          onClose={() => setNominating(null)}
        />
      )}
    </div>
  )
}
