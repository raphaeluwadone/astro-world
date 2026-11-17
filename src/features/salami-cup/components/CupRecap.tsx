import { Link } from '@tanstack/react-router'
import type { CupRecap, RecapPlayer } from '../recap'

const GRID = 'grid min-w-[420px] grid-cols-[minmax(120px,1fr)_repeat(5,40px)_48px] items-center gap-2 px-6'

/** The final table as recorded, for a cup from before the app. */
export function RecapTable({ recap, colourOf }: { recap: CupRecap; colourOf: (club: string) => string }) {
  const rows = [...recap.table].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  return (
    <div className="astro-card overflow-x-auto p-0">
      <div className="font-display px-6 pt-6 text-[28px] leading-none text-astro-text">FINAL TABLE</div>
      <div className={`${GRID} py-3.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim`}>
        <div>Squad</div>
        <div className="text-center">P</div>
        <div className="text-center">W</div>
        <div className="text-center">D</div>
        <div className="text-center">L</div>
        <div className="text-center">GD</div>
        <div className="text-right">Pts</div>
      </div>
      {rows.map((r) => (
        <div key={r.club} className={`${GRID} border-t border-white/[0.05] py-3`}>
          <div className="flex min-w-0 items-center gap-2">
            <div className="size-2 shrink-0 rounded-sm" style={{ background: colourOf(r.club) }} />
            <div className="truncate text-[13.5px] font-bold text-astro-text">{r.club}</div>
          </div>
          <div className="text-center text-xs text-astro-text-muted">{r.p}</div>
          <div className="text-center text-xs text-astro-text-muted">{r.w}</div>
          <div className="text-center text-xs text-astro-text-muted">{r.d}</div>
          <div className="text-center text-xs text-astro-text-muted">{r.l}</div>
          <div className="text-center text-xs text-astro-text-muted">{r.gd > 0 ? `+${r.gd}` : r.gd}</div>
          <div className="font-display text-right text-lg text-astro-amber">{r.pts}</div>
        </div>
      ))}
      <p className="px-6 pb-5 pt-3 text-[11.5px] text-astro-text-dim">Recorded in the almanac. Individual match results weren&rsquo;t kept.</p>
    </div>
  )
}

function Leaders({ title, rows }: { title: string; rows: RecapPlayer[] }) {
  if (rows.length === 0) return null
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">{title}</div>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={`${r.nickname}-${r.club}`} className="flex items-baseline gap-2 text-[13px]">
            {r.player_id ? (
              <Link to="/players/$playerId" params={{ playerId: r.player_id }} className="font-bold text-astro-text no-underline hover:underline">
                {r.nickname}
              </Link>
            ) : (
              <span className="font-bold text-astro-text">{r.nickname}</span>
            )}
            <span className="text-astro-text-dim">{r.club}</span>
            <span className="font-display ml-auto text-lg text-astro-amber">{r.v}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** MVP, top scorers and top assisters as recorded. */
export function RecapHighlights({ recap }: { recap: CupRecap }) {
  if (!recap.mvp && recap.scorers.length === 0 && recap.assisters.length === 0) return null
  return (
    <div className="astro-card flex flex-col gap-5 p-6">
      {recap.mvp && (
        <div>
          <div className="font-display mb-1 text-[28px] leading-none text-astro-text">CUP MVP</div>
          <div className="mb-2 flex flex-wrap items-baseline gap-x-2 text-[13px]">
            {recap.mvp.player_id ? (
              <Link to="/players/$playerId" params={{ playerId: recap.mvp.player_id }} className="font-extrabold text-astro-amber no-underline hover:underline">
                {recap.mvp.nickname}
              </Link>
            ) : (
              <span className="font-extrabold text-astro-amber">{recap.mvp.nickname}</span>
            )}
            <span className="text-astro-text-dim">{recap.mvp.tag}</span>
          </div>
          <p className="text-[13px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">{recap.mvp.text}</p>
        </div>
      )}
      <Leaders title="Top scorers" rows={recap.scorers} />
      <Leaders title="Top assisters" rows={recap.assisters} />
    </div>
  )
}
