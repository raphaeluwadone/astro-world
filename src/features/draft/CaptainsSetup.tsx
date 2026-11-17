import { cn } from 'cn'
import { useState } from 'react'
import { toast } from 'sonner'
import { withConfirm } from '@/components/dialogs/confirm'
import { AstroSelect } from '@/components/ui/astro-select'
import { TEAM_ID } from '@/lib/teamId'
import { useStartDraft } from './hooks'
import { shuffled } from './turn'

type Confirmed = { id: string; nickname: string; user_id?: string | null }

/** Chooses how many sides and who captains each, then starts the selection. */
export function CaptainsSetup({ matchdayId, confirmed }: { matchdayId: string; confirmed: Confirmed[] }) {
  const start = useStartDraft(matchdayId)
  const [count, setCount] = useState(() => Math.min(TEAM_ID.length, Math.max(2, Math.floor(confirmed.length / 6))))
  const [captains, setCaptains] = useState<string[]>(() => Array(TEAM_ID.length).fill(''))
  const [randomOrder, setRandomOrder] = useState(true)

  const chosen = captains.slice(0, count)
  const ready = chosen.every(Boolean) && confirmed.length > count
  const nameOf = (id: string) => confirmed.find((p) => p.id === id)?.nickname ?? 'Player'

  const begin = () => {
    // The order is drawn first so the confirm shows exactly who picks first.
    const order = randomOrder ? shuffled(chosen) : chosen
    const lines = order.map((id, i) => `${TEAM_ID[i].name}: ${nameOf(id)}`).join(', ')
    withConfirm(
      {
        tone: 'admin',
        eyebrow: 'Captains pick',
        title: 'Start the selection?',
        body: `${randomOrder ? 'Pick order drawn at random. ' : ''}${lines}. The Community goes quiet and shows only the picking until you publish the teams.`,
        confirmLabel: 'Start picking',
      },
      () =>
        start.mutate(
          { teamCount: count, captains: order, pool: confirmed.map((p) => p.id) },
          { onError: (e) => toast.error(e instanceof Error ? e.message : 'Couldn’t start the selection.') },
        ),
    )
  }

  return (
    <div>
      <p className="mb-3 text-[12.5px] text-astro-text-muted">
        Pick a captain for each side. They take turns choosing from everyone else. The order snakes: first to last, then last back to first, until nobody is left.
      </p>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[12.5px] font-bold text-astro-text-muted">Sides</span>
        {[2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCount(n)}
            className={cn('min-h-8 min-w-8 rounded-[8px] text-[13px] font-extrabold', count === n ? 'bg-astro-cyan/[0.16] text-astro-text' : 'border border-white/[0.09] text-astro-text-muted')}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-col gap-2">
        {Array.from({ length: count }, (_, i) => (
          <div key={TEAM_ID[i].name} className="grid grid-cols-[104px_1fr] items-center gap-2">
            <span className="flex items-center gap-2 text-[13px] font-extrabold text-astro-text">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: TEAM_ID[i].colour }} aria-hidden />
              {TEAM_ID[i].name}
            </span>
            <AstroSelect
              value={captains[i]}
              onValueChange={(v) => setCaptains((prev) => prev.map((c, j) => (j === i ? v : c)))}
              options={confirmed
                .filter((p) => !chosen.some((c, j) => j !== i && c === p.id))
                .map((p) => ({ value: p.id, label: p.user_id ? p.nickname : `${p.nickname} (no login)` }))}
              placeholder="Choose a captain"
              aria-label={`${TEAM_ID[i].name} captain`}
            />
          </div>
        ))}
      </div>
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-[13px] text-astro-text-muted">
        <input type="checkbox" checked={randomOrder} onChange={(e) => setRandomOrder(e.target.checked)} className="size-4 accent-astro-cyan" />
        Draw the pick order at random
      </label>
      <p className="mb-4 text-[12px] text-astro-text-dim">A captain with no login can&rsquo;t pick for themselves, so you pick for them from here.</p>

      {confirmed.length <= count && <p className="mb-3 text-[12.5px] text-astro-amber">There need to be more confirmed players than sides.</p>}
      <button
        type="button"
        disabled={!ready || start.isPending}
        onClick={begin}
        className="min-h-12 w-full rounded-[12px] bg-astro-cyan text-[15px] font-extrabold text-[#04121d] disabled:opacity-40"
      >
        {start.isPending ? 'Starting…' : 'Start the selection'}
      </button>
    </div>
  )
}
