import type { GoalRow, MatchDetail } from '../api'

export function GoalTimeline({ match, goals }: { match: MatchDetail; goals: GoalRow[] }) {
  if (goals.length === 0) {
    return <p className="text-sm text-astro-text-dim">No goals recorded.</p>
  }

  return (
    <div className="relative flex flex-col gap-1">
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/[0.07]" aria-hidden="true" />
      {goals.map((g) => {
        const isTeamA = g.team_id === match.team_a.id
        const colour = isTeamA ? match.team_a.colour : match.team_b.colour
        const detail = (
          <div>
            <div className="text-[13px] font-extrabold text-astro-text">{g.scorer.nickname}</div>
            <div className="text-[11.5px] text-astro-text-dim">
              assist {g.assist ? g.assist.nickname : '—'}
            </div>
          </div>
        )
        return (
          <div key={g.id} className="grid grid-cols-[1fr_56px_1fr] items-center gap-2.5 py-1.5">
            <div className={isTeamA ? 'text-right' : 'invisible'}>{detail}</div>
            <div className="flex justify-center">
              <div
                className="font-display rounded-[7px] border bg-astro-bg px-[9px] py-[5px] text-[17px] leading-none"
                style={{ borderColor: colour, color: colour }}
              >
                {g.minute}&apos;
              </div>
            </div>
            <div className={!isTeamA ? 'text-left' : 'invisible'}>{detail}</div>
          </div>
        )
      })}
    </div>
  )
}
