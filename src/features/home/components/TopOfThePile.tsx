import { NothingHere } from '@/components/states/NothingHere'
import { Link } from '@tanstack/react-router'
import type { RankingRow } from '@/features/rankings/api'
import { BadgeMark } from '@/features/badges/components/BadgeMark'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'

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
        <NothingHere compact body="Nobody qualifies yet." />
      ) : (
        <div className="flex flex-col gap-2">
          {topFour.map((r, i) => (
            <Link
              key={r.id}
              to="/players/$playerId"
              params={{ playerId: r.id }}
              className="flex items-center gap-3 rounded-[10px] bg-astro-surface-2 px-3 py-2.5 no-underline transition-colors hover:bg-[#1e2c56]"
            >
              <div className="font-display w-5 text-xl text-astro-text-dim">{i + 1}</div>
              <PlayerPhoto playerId={r.id} alt="" className="size-[30px] rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-extrabold text-astro-text">
                  <span className="truncate">{r.nickname}</span>
                  <BadgeMark playerId={r.id} size={14} />
                </div>
                <div className="truncate text-[11px] text-astro-text-dim">{r.full_name}</div>
              </div>
              <div className="font-display text-[22px] text-astro-accent">{r.avg_rating ?? 'NR'}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
