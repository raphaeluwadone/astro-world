import { LEAGUE_RECORDS } from '../records'

/** The league's record book, from the almanac. */
export function LeagueRecords() {
  return (
    <section className="astro-card p-5 md:p-6" aria-label="League records">
      <h2 className="mb-1 font-display text-[28px] leading-none text-astro-text">League records</h2>
      <p className="mb-4 text-[12.5px] text-astro-text-dim">From the almanac, as written during the 2025/26 season.</p>
      <ul className="grid gap-2.5 md:grid-cols-2">
        {LEAGUE_RECORDS.map((r) => (
          <li key={r.title} className="rounded-[12px] bg-astro-surface-2 px-4 py-3">
            <div className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">{r.title}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-[26px] leading-none text-astro-amber">{r.figure}</span>
              <span className="text-[13.5px] font-extrabold text-astro-text">{r.holder}</span>
            </div>
            {r.note && <p className="mt-1 text-[12px] leading-[1.5] text-astro-text-muted">{r.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
