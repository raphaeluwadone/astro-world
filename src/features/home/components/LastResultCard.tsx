import { Link } from '@tanstack/react-router'
import { LastResults } from '@/features/matchday/components/LastResults'
import { useMatchResults } from '@/features/matchday/hooks'

export function LastResultCard({ matchdayId, playedAt }: { matchdayId: string; playedAt: string }) {
  const { data: results = [] } = useMatchResults(matchdayId)
  const day = new Date(playedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
  return (
    <div className="astro-card p-[22px]">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Last Time Out</h2>
        <Link to="/matchday" className="text-xs font-extrabold text-astro-accent">
          Matchday
        </Link>
      </div>
      <div className="mb-3.5 text-xs text-astro-text-dim">{day}</div>
      <LastResults results={results} />
    </div>
  )
}
