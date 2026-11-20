import { cn } from 'cn'
import { TEAM_ID } from '@/lib/teamId'
import type { DrawPreview } from '../api'
import { RULE_COPY } from './DrawRulesForm'

const POSITIONS = ['GK', 'DEF', 'ATT', 'UTIL'] as const

function missText(rule: string, misses: number) {
  if (rule === 'ratings') return `${misses.toFixed(2)} apart`
  if (rule === 'positions') return `${misses} off`
  if (rule.endsWith('Pairs') || rule === 'noThreeWeeks') return `${misses} pair${misses === 1 ? '' : 's'}`
  return `${misses} over`
}

export function DrawPreviewCard({ preview, nameOf }: { preview: DrawPreview; nameOf: (id: string) => string }) {
  const { context: ctx } = preview
  const tags = (id: string) =>
    [ctx.cupWinners.has(id) && 'Cup', ctx.lastBest.has(id) && 'Last best', ctx.newcomers.has(id) && 'New', ctx.topScorers.has(id) && 'Scorer'].filter(Boolean) as string[]

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-1.5" aria-label="Rules">
        {preview.outcomes.map((o) => (
          <li
            key={o.rule}
            className={cn('rounded-full border px-2.5 py-1 text-[11.5px] font-bold', o.misses === 0 ? 'border-astro-green/40 text-astro-green' : 'border-astro-amber/50 text-astro-amber')}
          >
            {RULE_COPY[o.rule].label}
            {o.misses === 0 ? ' ✓' : ` · ${missText(o.rule, o.misses)}`}
          </li>
        ))}
      </ul>
      {preview.ratedCount < preview.teams.flat().length && preview.outcomes.some((o) => o.rule === 'ratings') && (
        <p className="text-[12px] text-astro-text-muted">
          {preview.teams.flat().length - preview.ratedCount} without ratings in this window count as average.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {preview.teams.map((team, i) => (
          <div key={i} className="rounded-[12px] border border-white/[0.08] p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: TEAM_ID[i].colour }} aria-hidden />
              <span className="font-display text-[20px] leading-none text-astro-text">{TEAM_ID[i].name}</span>
              {preview.teamRatings[i] != null && <span className="ml-auto text-[12px] font-bold tabular-nums text-astro-text-muted">{preview.teamRatings[i]!.toFixed(2)}</span>}
            </div>
            <div className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">
              {POSITIONS.filter((p) => preview.teamPositions[i][p] > 0)
                .map((p) => `${preview.teamPositions[i][p]} ${p}`)
                .join(' · ')}
            </div>
            <ul className="flex flex-col gap-0.5">
              {team.map((id) => (
                <li key={id} className="flex items-center gap-1.5 text-[13px] text-astro-text">
                  <span className="truncate">{nameOf(id)}</span>
                  {tags(id).map((t) => (
                    <span key={t} className="rounded-[4px] bg-white/[0.07] px-1 text-[9.5px] font-extrabold uppercase tracking-[0.06em] text-astro-text-muted">
                      {t}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
