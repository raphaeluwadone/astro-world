import { NothingHere } from '@/components/states/NothingHere'
import { Scene } from '@/components/states/Scene'
import type { GoalRow, MatchDetail } from '../api'

function Side({ team, goals }: { team: MatchDetail['team_a']; goals: GoalRow[] }) {
  return (
    <div className="rounded-xl border bg-astro-bg/50 p-4" style={{ borderColor: `color-mix(in srgb, ${team.colour} 35%, transparent)` }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: team.colour }} aria-hidden />
        <span className="text-[13px] font-extrabold text-astro-text">{team.greek_name}</span>
        <span className="ml-auto font-display text-[20px] leading-none" style={{ color: team.colour }}>
          {goals.length}
        </span>
      </div>
      {goals.length === 0 ? (
        <p className="text-[12.5px] text-astro-text-dim">No goals.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {goals.map((g) => (
            <li key={g.id} className="flex items-start gap-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" className="mt-0.5 shrink-0" style={{ color: team.colour }} aria-hidden>
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m12 7 4 3-1.5 4.5h-5L8 10Z" fill="currentColor" />
              </svg>
              <div>
                <div className="text-[13px] font-extrabold text-astro-text">
                  {g.scorer.nickname}
                  {g.own_goal && <span className="ml-1.5 text-[11px] text-astro-text-dim">own goal</span>}
                </div>
                {g.assist && <div className="text-[11.5px] text-astro-text-dim">assist {g.assist.nickname}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function GoalTimeline({ match, goals }: { match: MatchDetail; goals: GoalRow[] }) {
  if (goals.length === 0) {
    return <NothingHere compact icon={<Scene kind="goals" />} body="No goals recorded." />
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Side team={match.team_a} goals={goals.filter((g) => g.team_id === match.team_a.id)} />
      <Side team={match.team_b} goals={goals.filter((g) => g.team_id === match.team_b.id)} />
    </div>
  )
}
