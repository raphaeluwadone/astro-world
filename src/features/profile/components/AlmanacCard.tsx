import { monthSeries, inlineParts, type PlayerAlmanac } from '../almanac'
import { usePlayerAlmanac } from '../hooks'

function Months({ almanac }: { almanac: PlayerAlmanac }) {
  const series = monthSeries(almanac.months)
  const max = Math.max(1, ...series.map((m) => m.g + m.a))
  if (series.every((m) => m.g + m.a === 0)) return null
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-astro-text-dim">
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.13em]">2026, month by month</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-astro-accent" /> Goals
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-astro-cyan" /> Assists
        </span>
        {series.some((m) => m.dotm) && <span className="font-extrabold text-astro-green">Green: Defender of the Month score</span>}
      </div>
      <ol className="grid grid-cols-11 items-end gap-1.5">
        {series.map((m) => {
          const total = m.g + m.a
          return (
            <li key={m.label} className="flex min-w-0 flex-col items-center gap-1" aria-label={`${m.label}: ${m.g} goals, ${m.a} assists`}>
              <span className="text-[10.5px] font-bold tabular-nums text-astro-text-muted">{total || ''}</span>
              <div className="flex h-20 w-full flex-col justify-end overflow-hidden rounded-[4px] bg-white/[0.04]">
                <div className="bg-astro-cyan" style={{ height: `${(m.a / max) * 100}%` }} />
                <div className="bg-astro-accent" style={{ height: `${(m.g / max) * 100}%` }} />
              </div>
              <span className="text-[10px] font-bold text-astro-text-dim">{m.label}</span>
              {m.dotm ? <span className="text-[9.5px] font-extrabold text-astro-green">{m.dotm}</span> : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** What the group's almanac says about a player: a short write-up, notable facts and a month-by-month chart. */
export function AlmanacCard({ playerId }: { playerId: string | undefined }) {
  const { data } = usePlayerAlmanac(playerId)
  if (!data || (!data.write_up && data.facts.length === 0)) return null
  return (
    <section className="astro-card flex flex-col gap-5 p-5 md:p-6" aria-label="From the almanac">
      <div>
        <div className="astro-eyebrow">From the almanac</div>
        {data.write_up && (
          <p className="mt-2 max-w-[68ch] text-[14.5px] leading-[1.65] text-astro-text [text-wrap:pretty]">
            {inlineParts(data.write_up).map((p, i) =>
              p.style === 'bold' ? (
                <strong key={i} className="font-extrabold">
                  {p.text}
                </strong>
              ) : p.style === 'italic' ? (
                <em key={i} className="font-semibold text-astro-accent-soft not-italic">
                  {p.text}
                </em>
              ) : (
                <span key={i}>{p.text}</span>
              ),
            )}
          </p>
        )}
      </div>

      {data.facts.length > 0 && (
        <div>
          <div className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">Record book</div>
          <ul className="flex flex-col gap-1.5">
            {data.facts.map((f) => (
              <li key={f} className="flex gap-2.5 text-[13.5px] leading-[1.5] text-astro-text-muted">
                <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-astro-accent" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Months almanac={data} />

      <p className="text-[11.5px] text-astro-text-dim">Written during the 2025/26 season, so figures inside the text are as they were then.</p>
    </section>
  )
}
