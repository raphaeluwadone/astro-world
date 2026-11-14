import { withConfirm } from '@/components/dialogs/confirm'
import { cn } from 'cn'
import { useState } from 'react'
import { toast } from 'sonner'
import { TagHoverCard } from '@/components/hover/InfoCards'
import { AstroSelect } from '@/components/ui/astro-select'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { usePlayerCards } from '@/features/players/hooks'
import type { TagPoolRow } from '../api'
import { useInventTrait, usePendingTraits, usePlayerTraitVote, usePlayerTraitVotes, useTraitVote } from '../hooks'

const VOTES_NEEDED = 3

function VoteCount({ n }: { n: number }) {
  return (
    <span className="text-[10.5px] font-extrabold text-astro-text-dim">
      {Math.min(n, VOTES_NEEDED)}/{VOTES_NEEDED}
    </span>
  )
}

/** Invent a trait, vote new ones into the pool, and vote traits onto teammates. */
export function TagPool({ tags }: { tags: TagPoolRow[] }) {
  const { player } = useCurrentPlayer()
  const me = player?.id ?? null
  const { data: pending = [] } = usePendingTraits(me)
  const { data: players = [] } = usePlayerCards()
  const invent = useInventTrait(me)
  const voteIn = useTraitVote(me)
  const [label, setLabel] = useState('')
  const [teammate, setTeammate] = useState('')
  const { data: teammateVotes = [] } = usePlayerTraitVotes(teammate || undefined, me)
  const voteOn = usePlayerTraitVote(me)
  const teammateCard = players.find((p) => p.id === teammate)

  const create = () => {
    const clean = label.trim()
    if (clean.length < 2) return
    withConfirm({ title: `Put “${clean}” up for a vote?`, body: 'Everyone can see it. Three votes and it joins the trait pool.', confirmLabel: 'Put it up' }, () => invent.mutate(clean, {
      onSuccess: () => {
        setLabel('')
        toast.success(`${clean} is up for a vote. Two more and it joins the pool.`)
      },
      onError: (e) => toast.error(/duplicate|unique/i.test(String((e as { message?: string }).message)) ? 'That trait already exists.' : 'Couldn’t create that. Try again.'),
    }))
  }

  return (
    <div className="astro-card p-[22px]">
      <h2 className="mb-1.5 font-display text-[26px] leading-none text-astro-text">Traits</h2>
      <p className="mb-3.5 text-[13px] text-astro-text-muted [text-wrap:pretty]">
        How someone plays, in a word or two. Three votes put a trait in the pool, and three votes on a teammate put it on their card.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <TagHoverCard key={t.id} label={t.label}>
            <span className="inline-block rounded-lg border border-border bg-astro-surface-2 px-3 py-[7px] text-xs font-bold text-astro-text-muted hover:text-astro-text">
              #{t.label}
            </span>
          </TagHoverCard>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">Up for a vote</div>
          <div className="flex flex-col gap-1.5">
            {pending.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-lg bg-astro-surface-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-astro-text">#{t.label}</span>
                <VoteCount n={t.votes} />
                <button
                  type="button"
                  disabled={!me || voteIn.isPending || t.mine}
                  title={t.mine ? 'Your own trait counts as your vote' : undefined}
                  onClick={() => voteIn.mutate({ tagId: t.id, on: !t.votedByMe })}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-[11.5px] font-extrabold transition-colors disabled:opacity-60',
                    t.votedByMe ? 'border-astro-accent bg-astro-accent/20 text-astro-text' : 'border-astro-accent/40 text-astro-accent-soft hover:border-astro-accent',
                  )}
                >
                  {t.mine ? 'Yours' : t.votedByMe ? 'Voted' : 'Vote in'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        className="mb-5 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          create()
        }}
      >
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={24}
          placeholder="Invent a trait…"
          aria-label="New trait"
          className="min-h-[42px] min-w-0 flex-1 rounded-[9px] border border-white/[0.12] bg-astro-surface-2 px-3 text-[12.5px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-accent/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!me || label.trim().length < 2 || invent.isPending}
          className="min-h-[42px] rounded-[9px] border border-[rgba(166,63,255,0.4)] bg-astro-surface-2 px-3.5 text-[12.5px] font-extrabold text-astro-accent-soft hover:border-astro-accent disabled:opacity-50"
        >
          Create
        </button>
      </form>

      <div className="border-t border-white/[0.06] pt-4">
        <div className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">Give a teammate a trait</div>
        <AstroSelect
          size="sm"
          aria-label="Teammate"
          placeholder="Pick a teammate"
          value={teammate}
          onValueChange={setTeammate}
          options={players.filter((p) => p.id !== me).map((p) => ({ value: p.id, label: p.nickname }))}
          className="mb-2.5 w-full"
        />
        {teammateCard && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const v = teammateVotes.find((x) => x.tagId === t.id)
              const has = teammateCard.tags.includes(t.label)
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={voteOn.isPending}
                  aria-pressed={!!v?.votedByMe}
                  onClick={() => voteOn.mutate({ playerId: teammate, tagId: t.id, on: !v?.votedByMe })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-60',
                    v?.votedByMe ? 'border-astro-accent bg-astro-accent/20 text-astro-text' : 'border-border bg-astro-surface-2 text-astro-text-muted hover:text-astro-text',
                  )}
                >
                  #{t.label}
                  {has ? <span className="text-[10.5px] font-extrabold text-astro-green">On card</span> : <VoteCount n={v?.votes ?? 0} />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
