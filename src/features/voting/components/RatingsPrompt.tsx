import { Link } from '@tanstack/react-router'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { usePendingRatings } from '../hooks'

function closesLabel(closesAt: string) {
  return new Date(closesAt).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }).replace(',', '')
}

function dayName(playedAt: string) {
  return new Date(playedAt).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Europe/London' })
}

/** The "go and rate" banner, shown while the signed-in player still has players to rate. */
export function RatingsBanner({ className }: { className?: string }) {
  const { player } = useCurrentPlayer()
  const pending = usePendingRatings(player?.id)
  if (!pending) return null
  return (
    <div className={className}>
      <RatingsPrompt pending={pending.pending} playedAt={pending.matchday.playedAt} closesAt={pending.matchday.closesAt} />
    </div>
  )
}

export function RatingsPrompt({ pending, playedAt, closesAt }: { pending: number; playedAt: string; closesAt: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-[18px] border-[1.5px] border-[rgba(166,63,255,0.4)] px-[26px] py-6"
      style={{
        background: 'linear-gradient(100deg, #2a1147 0%, #111a33 62%)',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 26px), calc(100% - 26px) 100%, 0 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, transparent 44%, rgba(255,255,255,0.09) 50%, transparent 56%)',
        }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-accent-soft">
            Ratings open &middot; closes {closesLabel(closesAt)}
          </div>
          <div className="font-display mb-1.5 text-[34px] leading-none text-astro-text">
            Rate {dayName(playedAt)}&rsquo;s Lot
          </div>
          <p className="max-w-[52ch] text-sm text-astro-text-muted [text-wrap:pretty]">
            {pending} player{pending === 1 ? '' : 's'} still waiting on your verdict. Be honest,
            anonymous, and averaged before anyone sees it.
          </p>
        </div>
        <Link
          to="/matchday/voting"
          className="shrink-0 rounded-[11px] bg-astro-accent px-[22px] py-[13px] text-sm font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5"
        >
          Start rating
        </Link>
      </div>
    </div>
  )
}
