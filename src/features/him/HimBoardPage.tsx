import { useQueryClient } from '@tanstack/react-query'
import { Scene } from '@/components/states/Scene'
import { cn } from 'cn'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PlayerHoverCard } from '@/components/hover/InfoCards'
import { ErrorState } from '@/components/states/ErrorState'
import { NothingHere } from '@/components/states/NothingHere'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import { usePlayerCards } from '@/features/players/hooks'
import { ComparisonPickerPanel } from '@/features/profile/components/ComparisonPickerPanel'
import { useRemoveComparison } from '@/features/profile/hooks'
import type { BoardClaim } from './api'
import { useBoardVote, useHimBoard } from './hooks'

const DROP_AT = 15
type Filter = 'all' | 'unvoted' | 'danger'

const UP = 'M12 3.4 21 13h-5.4v7.6H8.4V13H3Z'
const DOWN = 'M12 20.6 3 11h5.4V3.4h7.2V11H21Z'

function ClaimRow({ c, canVote, voterId }: { c: BoardClaim; canVote: boolean; voterId: string }) {
  const vote = useBoardVote()
  const net = c.upvotes - c.downvotes
  const cast = (direction: 'up' | 'down') =>
    vote.mutate({ comparisonId: c.id, voterId, direction: c.myVote === direction ? null : direction }, { onError: () => toast.error('Couldn’t save that vote.') })

  return (
    <div className="flex items-center gap-2.5 rounded-[10px] bg-astro-bg/60 px-2.5 py-2">
      {c.pro.photo_url ? (
        <img src={c.pro.photo_url} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="size-8 shrink-0 rounded-lg bg-[linear-gradient(150deg,#2c3c74,#131c3a)]" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-extrabold text-astro-text">{c.pro.name}</div>
        <div className="truncate text-[11px] text-astro-text-dim">
          {c.pro.role ?? 'Player'}
          {net <= -8 && <span className="text-astro-amber"> · {Math.abs(net)} of {DROP_AT} underwater</span>}
        </div>
      </div>
      {(['up', 'down'] as const).map((d) => (
        <button
          key={d}
          type="button"
          disabled={!canVote || vote.isPending}
          aria-pressed={c.myVote === d}
          aria-label={`${d === 'up' ? 'Up-vote' : 'Down-vote'} ${c.pro.name}, ${d === 'up' ? c.upvotes : c.downvotes}`}
          onClick={() => cast(d)}
          className="flex min-h-8 items-center gap-1 rounded-lg border px-2 text-xs font-extrabold disabled:opacity-50"
          style={{
            background: '#0a0f1f',
            color: d === 'up' ? '#4ade80' : '#e0483f',
            borderColor: c.myVote === d ? (d === 'up' ? '#4ade80' : '#e0483f') : d === 'up' ? 'rgba(74,222,128,0.3)' : 'rgba(224,72,63,0.3)',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={d === 'up' ? UP : DOWN} />
          </svg>
          {d === 'up' ? c.upvotes : c.downvotes}
        </button>
      ))}
      <span className={cn('w-8 text-right font-display text-base', net >= 0 ? 'text-astro-accent' : 'text-astro-red')}>
        {net >= 0 ? '+' : ''}
        {net}
      </span>
    </div>
  )
}

function Column({ title, color, claims, canVote, voterId }: { title: string; color: string; claims: BoardClaim[]; canVote: boolean; voterId: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em]" style={{ color }}>
        {title}
      </div>
      {claims.length === 0 ? (
        <p className="px-1 py-2 text-xs text-astro-text-dim">None yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {claims.map((c) => (
            <ClaimRow key={c.id} c={c} canVote={canVote} voterId={voterId} />
          ))}
        </div>
      )}
    </div>
  )
}

export function HimBoardPage() {
  const { player } = useCurrentPlayer()
  const me = player?.id ?? null
  const qc = useQueryClient()
  const { data: claims = [], isLoading, isError, refetch } = useHimBoard(me)
  const { data: players = [] } = usePlayerCards()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [nominating, setNominating] = useState<{ id: string; nickname: string } | null>(null)
  // Nominations made on this visit can be taken back until you leave the page.
  const [justPicked, setJustPicked] = useState<{ id: string; name: string; playerId: string; nickname: string }[]>([])
  const remove = useRemoveComparison(justPicked[0]?.playerId)

  const rows = useMemo(() => {
    const byPlayer = new Map<string, BoardClaim[]>()
    for (const c of claims) byPlayer.set(c.playerId, [...(byPlayer.get(c.playerId) ?? []), c])
    const q = query.trim().toLowerCase()
    return players
      .filter((p) => !q || p.nickname.toLowerCase().includes(q) || p.full_name.toLowerCase().includes(q))
      .map((p) => {
        const all = (byPlayer.get(p.id) ?? []).sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
        const visible = all.filter((c) =>
          filter === 'unvoted' ? !c.myVote && p.id !== me : filter === 'danger' ? c.upvotes - c.downvotes <= -8 : true,
        )
        return { p, self: visible.filter((c) => c.source === 'self'), group: visible.filter((c) => c.source === 'community'), total: all.length }
      })
      .filter((r) => (filter === 'all' ? r.total > 0 || !!q : r.self.length + r.group.length > 0))
      .sort((a, b) => b.total - a.total || a.p.nickname.localeCompare(b.p.nickname))
  }, [claims, players, filter, query, me])

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const unvoted = claims.filter((c) => !c.myVote && c.playerId !== me).length

  return (
    <div className="mx-auto max-w-[980px]">
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">The whole group</div>
      <h1 className="mb-2 font-display text-[44px] leading-[0.95] text-astro-text md:text-[56px]">He Is Him</h1>
      <p className="mb-5 max-w-[62ch] text-sm text-astro-text-muted [text-wrap:pretty]">
        Everyone&rsquo;s claims in one place. Back the ones that are right, sink the ones that aren&rsquo;t, and nominate who you think
        someone really plays like. Fifteen votes underwater and a claim is dropped.
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'unvoted', label: `Not voted${unvoted ? ` · ${unvoted}` : ''}` },
            { id: 'danger', label: 'Close to the drop' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-[12.5px] font-bold transition-colors',
              filter === f.id ? 'border-astro-accent/55 bg-astro-accent/15 text-astro-text' : 'border-white/[0.08] bg-astro-surface-2 text-astro-text-muted hover:text-astro-text',
            )}
          >
            {f.label}
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a player"
          aria-label="Find a player"
          className="ml-auto min-h-9 w-full rounded-full border border-white/[0.1] bg-astro-surface-2 px-3.5 text-[13px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-accent/60 focus:outline-none sm:w-56"
        />
      </div>

      {justPicked.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {justPicked.map((j) => (
            <div key={j.id} className="flex items-center gap-3 rounded-xl border border-astro-accent/30 bg-astro-accent/[0.08] px-4 py-2.5 text-[13px]">
              <span className="min-w-0 flex-1 text-astro-text-muted">
                You nominated <span className="font-extrabold text-astro-text">{j.name}</span> for {j.nickname}.
              </span>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(j.id, {
                    onSuccess: () => {
                      setJustPicked((list) => list.filter((x) => x.id !== j.id))
                      qc.invalidateQueries({ queryKey: ['him-board'] })
                    },
                    onError: () => toast.error('Couldn’t undo that. Try again.'),
                  })
                }
                className="shrink-0 rounded-lg border border-white/[0.12] px-3 py-1 text-xs font-extrabold text-astro-text hover:border-astro-accent/60 disabled:opacity-60"
              >
                Undo
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <NothingHere
          icon={<Scene kind="rating" />}
          title={filter === 'unvoted' ? 'All caught up' : 'No claims yet'}
          body={filter === 'unvoted' ? 'You’ve voted on every claim.' : filter === 'danger' ? 'Nobody’s close to being voted off.' : 'No claims yet.'}
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {rows.map(({ p, self, group }) => {
            const isMe = p.id === me
            return (
              <section key={p.id} className="astro-card @container p-4 md:p-5">
                <div className="mb-3 flex items-center gap-3">
                  <PlayerPhoto playerId={p.id} alt="" className="size-10 rounded-[10px]" />
                  <div className="min-w-0 flex-1">
                    <PlayerHoverCard playerId={p.id} name={p.nickname} className="font-display text-[24px] leading-none text-astro-text hover:underline">
                      {p.nickname}
                    </PlayerHoverCard>
                    <div className="truncate text-[11.5px] text-astro-text-dim">{p.positions.join(' / ') || p.full_name}</div>
                  </div>
                  {!isMe && me && (
                    <button
                      type="button"
                      onClick={() => setNominating({ id: p.id, nickname: p.nickname })}
                      className="shrink-0 rounded-[10px] border border-dashed border-[#38bdf8]/50 px-3 py-2 text-xs font-bold text-[#38bdf8] hover:border-solid"
                    >
                      + Nominate
                    </button>
                  )}
                </div>
                <div className="grid gap-3 @2xl:grid-cols-2">
                  <Column title="I am him" color="#c589ff" claims={self} canVote={!isMe} voterId={me!} />
                  <Column title="You are him" color="#eef0f9" claims={group} canVote={!isMe} voterId={me!} />
                </div>
              </section>
            )
          })}
        </div>
      )}

      {nominating && me && (
        <ComparisonPickerPanel
          source="community"
          playerId={nominating.id}
          createdBy={me}
          subjectNickname={nominating.nickname}
          ownSelfClaims={[]}
          onClose={() => setNominating(null)}
          onPicked={(id, name) => {
            setJustPicked((list) => [...list, { id, name, playerId: nominating.id, nickname: nominating.nickname }])
            qc.invalidateQueries({ queryKey: ['him-board'] })
          }}
        />
      )}
    </div>
  )
}
