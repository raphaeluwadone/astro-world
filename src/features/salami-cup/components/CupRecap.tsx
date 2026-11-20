import { Link } from '@tanstack/react-router'
import type { CupRecap, RecapDefender, RecapInvolvement, RecapPlayer } from '../recap'

const STICKY = 'sticky left-0 z-[1] bg-[#111a33] shadow-[6px_0_8px_-6px_rgba(0,0,0,0.5)]'

/** The final table as recorded, for a cup from before the app. The squad column stays put while the numbers scroll. */
export function RecapTable({ recap, colourOf }: { recap: CupRecap; colourOf: (club: string) => string }) {
  const rows = [...recap.table].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  const head = 'px-2.5 py-3.5 text-center text-[10px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim'
  const cell = 'px-2.5 py-3 text-center text-xs text-astro-text-muted'
  return (
    <div className="astro-card p-0">
      <div className="font-display px-6 pt-6 text-[28px] leading-none text-astro-text">FINAL TABLE</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr>
              <th className={`${head} ${STICKY} pl-6 text-left`}>Squad</th>
              {['P', 'W', 'D', 'L', 'GF', 'GA', 'GD'].map((h) => (
                <th key={h} className={head}>
                  {h}
                </th>
              ))}
              <th className={`${head} pr-6 text-right`}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.club} className="border-t border-white/[0.05]">
                <td className={`${STICKY} py-3 pl-6 pr-3`}>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="size-2 shrink-0 rounded-sm" style={{ background: colourOf(r.club) }} />
                    <span className="text-[13.5px] font-bold text-astro-text">{r.club}</span>
                  </div>
                </td>
                <td className={cell}>{r.p}</td>
                <td className={cell}>{r.w}</td>
                <td className={cell}>{r.d}</td>
                <td className={cell}>{r.l}</td>
                <td className={cell}>{r.gf}</td>
                <td className={cell}>{r.ga}</td>
                <td className={cell}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                <td className="font-display py-3 pl-2.5 pr-6 text-right text-lg text-astro-amber">{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function Involvements({ rows }: { rows: RecapInvolvement[] }) {
  if (rows.length === 0) return null
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">Goals and assists</div>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={`${r.nickname}-${r.club}`} className="flex items-baseline gap-2 text-[13px]">
            <span className="font-bold text-astro-text">{r.nickname}</span>
            <span className="text-astro-text-dim">{r.club}</span>
            <span className="ml-auto text-astro-text-muted">
              {r.g}G {r.a}A
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The defender points table for the cup, with the scoring rules. The player column stays put while the numbers scroll. */
export function RecapDefenders({ recap }: { recap: CupRecap }) {
  const rows: RecapDefender[] = recap.dotm
  if (rows.length === 0) return null
  const head = 'px-2.5 py-2 text-center text-[10px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim'
  const cell = 'px-2.5 py-2.5 text-center text-xs text-astro-text-muted'
  return (
    <div className="astro-card p-0">
      <div className="font-display px-6 pt-6 text-[28px] leading-none text-astro-text">DEFENDER OF THE CUP</div>
      {recap.dotm_rules && <p className="px-6 pt-1.5 text-[11.5px] text-astro-text-dim">{recap.dotm_rules}</p>}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr>
              <th className={`${head} ${STICKY} pl-6 text-left`}>Player</th>
              {['CS', 'G', 'A', 'YC'].map((h) => (
                <th key={h} className={head}>
                  {h}
                </th>
              ))}
              <th className={`${head} pr-6 text-right`}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.nickname}-${r.club}`} className="border-t border-white/[0.05]">
                <td className={`${STICKY} py-2.5 pl-6 pr-3`}>
                  <div className="whitespace-nowrap text-[13.5px] font-bold text-astro-text">{r.nickname}</div>
                  <div className="whitespace-nowrap text-[11px] text-astro-text-dim">{r.club}</div>
                </td>
                <td className={cell}>{r.cs}</td>
                <td className={cell}>{r.g}</td>
                <td className={cell}>{r.a}</td>
                <td className={cell}>{r.yc}</td>
                <td className="font-display py-2.5 pl-2.5 pr-6 text-right text-lg text-astro-amber">{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h-3" />
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
      <Involvements rows={recap.ga_leaders} />
      {recap.yellow_cards.length > 0 && (
        <p className="text-[12.5px] text-astro-text-muted">
          <span className="font-extrabold uppercase tracking-[0.1em] text-[10.5px] text-astro-text-dim">Yellow cards </span>
          {recap.yellow_cards.join(', ')}
        </p>
      )}
    </div>
  )
}
