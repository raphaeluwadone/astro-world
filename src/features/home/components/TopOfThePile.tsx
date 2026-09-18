import { Link } from '@tanstack/react-router'
import type { RankingRow } from '@/features/rankings/api'

export function TopOfThePile({ rankings }: { rankings: RankingRow[] }) {
  const topFour = [...rankings]
    .sort((a, b) => (b.avg_rating ?? -1) - (a.avg_rating ?? -1))
    .slice(0, 4)

  return (
    <div className="astro-card p-[22px]">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Top of the Pile</h2>
        <Link to="/rankings" className="text-xs font-extrabold text-astro-accent">
          All
        </Link>
      </div>
      {topFour.length === 0 ? (
        <p className="text-sm text-astro-text-dim">Nobody qualifies yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {topFour.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3 rounded-[10px] bg-astro-surface-2 px-3 py-2.5">
              <div className="font-display w-5 text-xl text-astro-text-dim">{i + 1}</div>
              <div
                className="size-[30px] shrink-0 rounded-lg"
                style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-extrabold text-astro-text">{r.nickname}</div>
                <div className="truncate text-[11px] text-astro-text-dim">{r.full_name}</div>
              </div>
              <div className="font-display text-[22px] text-astro-accent">{r.avg_rating ?? '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
