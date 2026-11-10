import { BadgeHoverCard } from '@/features/badges/components/BadgeHoverCard'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { BadgeSquare } from '@/features/badges/components/BadgePatch'
import type { HallEntry, HallYear } from '../feed'

const GOLD_TEXT = 'bg-[linear-gradient(180deg,#ffe8b5,#f2a93b)] bg-clip-text text-transparent'

export function YearChips({ years, year, onChange }: { years: number[]; year: number; onChange: (y: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Year">
      {years.map((y) => (
        <button
          key={y}
          type="button"
          role="tab"
          aria-selected={y === year}
          onClick={() => onChange(y)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-bold transition-colors',
            y === year
              ? 'border-[rgba(242,169,59,0.5)] bg-[rgba(242,169,59,0.16)] text-[#f7c25e]'
              : 'border-white/[0.08] text-astro-text-muted hover:text-astro-text',
          )}
        >
          {y}
        </button>
      ))}
    </div>
  )
}

const isSilverware = (e: HallEntry) => e.badges[0].badge_key === 'silverware'

function cupTitle(e: HallEntry) {
  const name = isSilverware(e) ? 'Salami Cup' : e.name
  return e.quarter ? `${name} ${e.quarter}` : name
}

function Winners({ entry, max = 1 }: { entry: HallEntry; max?: number }) {
  if (entry.team && entry.badges.length > 1) return <>{entry.team}</>
  const shown = entry.badges.slice(0, max)
  const rest = entry.badges.length - shown.length
  return (
    <>
      {shown.map((b, i) => (
        <span key={b.id}>
          {i > 0 && ', '}
          <Link to="/players/$playerId" params={{ playerId: b.player_id }} className="hover:underline">
            {b.nickname}
          </Link>
        </span>
      ))}
      {rest > 0 && <span className="block text-[11px] font-semibold text-astro-text-dim">joint with {rest} {rest === 1 ? 'other' : 'others'}</span>}
    </>
  )
}

function Row({ entry, gold, nameClass }: { entry: HallEntry; gold?: boolean; nameClass?: string }) {
  return (
    <div className="flex items-baseline gap-2.5 border-b border-dashed border-white/[0.08] py-2 last:border-b-0">
      <BadgeHoverCard
        awardKey={entry.badges[0].badge_key}
        triggerClassName={cn('inline rounded whitespace-nowrap font-display text-[19px] leading-none cursor-pointer hover:underline', gold ? GOLD_TEXT : nameClass)}
      >
        {gold ? cupTitle(entry) : entry.name}
      </BadgeHoverCard>
      <span className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-white/15" />
      <span className="text-right text-[13px] font-extrabold text-astro-text">
        <Winners entry={entry} />
      </span>
    </div>
  )
}

/** Small roll for a side column. */
export function HallOfFameCompact({
  hall,
  year,
  onYear,
  footer,
}: {
  hall: HallYear[]
  year: number
  onYear: (y: number) => void
  footer?: React.ReactNode
}) {
  const current = hall.find((h) => h.year === year)
  return (
    <div className="astro-card p-5">
      <h2 className="mb-3 font-display text-[28px] leading-none text-astro-text">Hall of fame</h2>
      {hall.length === 0 ? (
        <p className="text-sm text-astro-text-dim">The first names go up once the first titles are confirmed.</p>
      ) : (
        <>
          <div className="mb-2">
            <YearChips years={hall.map((h) => h.year)} year={year} onChange={onYear} />
          </div>
          {current?.cups.map((e) => <Row key={e.key} entry={e} gold />)}
          {current?.titles.slice(0, 6).map((e) => <Row key={e.key} entry={e} />)}
          {current && current.cups.length + current.titles.length === 0 && (
            <p className="py-2 text-sm text-astro-text-dim">No yearly titles for {year} yet.</p>
          )}
        </>
      )}
      {footer}
    </div>
  )
}

/** The gold honours board for one year. */
export function HonoursBoard({ hall, year, onYear }: { hall: HallYear[]; year: number; onYear: (y: number) => void }) {
  const current = hall.find((h) => h.year === year)
  return (
    <section
      className="rounded-[18px] border border-[rgba(242,169,59,0.35)] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,232,181,0.15)] md:px-7"
      style={{ background: 'radial-gradient(120% 140% at 50% 0%, rgba(242,169,59,0.16), transparent 60%), linear-gradient(180deg, #141d3b, #0d142b)' }}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c9a56a]">Roll of honour</div>
          <h2 className={cn('font-display text-[48px] leading-[0.95] md:text-[56px]', GOLD_TEXT)}>{year} Honours</h2>
        </div>
        {hall.length > 1 && <YearChips years={hall.map((h) => h.year)} year={year} onChange={onYear} />}
      </div>

      {!current || current.cups.length + current.titles.length === 0 ? (
        <p className="py-4 text-sm text-astro-text-muted">Nothing on the board for {year} yet. Yearly titles go up once an admin confirms them.</p>
      ) : (
        <>
          {current.cups.filter(isSilverware).map((e) => (
            <div key={e.key} className="mb-3 flex items-center gap-3.5 rounded-xl border border-[rgba(242,169,59,0.4)] bg-[rgba(242,169,59,0.10)] px-4 py-3.5">
              <BadgeSquare badge={e.badges[0]} size={44} />
              <div className="min-w-0">
                <BadgeHoverCard awardKey="silverware" triggerClassName={cn('inline-block rounded font-display text-[28px] leading-none cursor-pointer hover:underline', GOLD_TEXT)}>
                  Salami Cup{e.quarter ? ` ${e.quarter}` : ''}
                  {e.team ? ` · ${e.team}` : ''}
                </BadgeHoverCard>
                <div className="mt-0.5 text-[12.5px] text-astro-text-muted">
                  {e.badges.map((b) => b.nickname).join(', ')}
                  {e.badges[0].stat ? ` · ${e.badges[0].stat}` : ''}
                </div>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-x-9">
            {current.cups
              .filter((e) => !isSilverware(e))
              .map((e) => (
                <Row key={e.key} entry={e} gold />
              ))}
            {current.titles.map((e) => (
              <Row key={e.key} entry={e} nameClass="text-[#f3dcb0]" />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

/** Monthly award winners for the year, newest month first. */
export function MonthlyRoll({ year }: { year: HallYear | undefined }) {
  if (!year || year.months.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 font-display text-[28px] leading-none text-astro-text">Month by month</h2>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))' }}>
        {year.months.map((m) => (
          <div key={m.index} className="astro-card p-4">
            <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-astro-cyan">{m.month}</div>
            {m.entries.map((e) => (
              <Row key={e.key} entry={e} nameClass="text-[17px] text-astro-text" />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
