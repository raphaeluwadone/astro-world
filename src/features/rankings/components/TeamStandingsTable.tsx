import type { MatchResult, TeamStandingRow } from '../api'

const GRID = '44px minmax(0,2fr) repeat(6,minmax(0,0.6fr)) minmax(0,0.9fr) minmax(0,1.2fr)'

function formChipStyle(result: MatchResult) {
  if (result === 'W') return { background: 'rgba(74,222,128,0.16)', color: '#4ade80' }
  if (result === 'L') return { background: 'rgba(224,72,63,0.16)', color: '#e0483f' }
  return { background: '#182448', color: '#9aa3c4' }
}

export function TeamStandingsTable({ standings }: { standings: TeamStandingRow[] }) {
  return (
    <div className="astro-card overflow-hidden">
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[720px] gap-2.5 px-5 py-3.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim"
          style={{ gridTemplateColumns: GRID, background: '#182448' }}
        >
          <div>#</div>
          <div>Team</div>
          <div className="text-center">P</div>
          <div className="text-center">W</div>
          <div className="text-center">D</div>
          <div className="text-center">L</div>
          <div className="text-center">GF</div>
          <div className="text-center">GA</div>
          <div className="text-center">GD</div>
          <div className="text-right">Form &middot; Pts</div>
        </div>
        {standings.map((t, i) => (
          <div
            key={t.name}
            className="grid min-w-[720px] items-center gap-2.5 border-t border-border px-5 py-[13px]"
            style={{ gridTemplateColumns: GRID }}
          >
            <div className="font-display text-2xl leading-none text-astro-text">{i + 1}</div>
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border-[1.5px]"
                style={{ background: '#0d1428', borderColor: t.colour }}
              >
                <span className="font-display text-base leading-none" style={{ color: t.colour }}>
                  {t.glyph}
                </span>
              </div>
              <div className="truncate text-[13.5px] font-extrabold text-astro-text">{t.name}</div>
            </div>
            <div className="text-center text-[13px] text-astro-text-muted">{t.played}</div>
            <div className="text-center text-[13px] font-bold text-astro-text">{t.wins}</div>
            <div className="text-center text-[13px] text-astro-text-muted">{t.draws}</div>
            <div className="text-center text-[13px] text-astro-text-muted">{t.losses}</div>
            <div className="text-center text-[13px] text-astro-text-muted">{t.goalsFor}</div>
            <div className="text-center text-[13px] text-astro-text-muted">{t.goalsAgainst}</div>
            <div
              className="text-center text-[13px] font-bold"
              style={{
                color: t.goalDifference > 0 ? '#4ade80' : t.goalDifference < 0 ? '#e0483f' : '#9aa3c4',
              }}
            >
              {t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}
            </div>
            <div className="flex min-w-0 items-center justify-end gap-2.5">
              <div className="flex shrink-0 gap-[3px]">
                {t.form.map((r, formIndex) => (
                  <div
                    key={formIndex}
                    className="flex size-[18px] items-center justify-center rounded-[5px] text-[9px] font-extrabold"
                    style={formChipStyle(r)}
                  >
                    {r}
                  </div>
                ))}
              </div>
              <div className="font-display min-w-[30px] text-right text-[22px] leading-none text-astro-text">
                {t.points}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
