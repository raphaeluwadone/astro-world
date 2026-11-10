import { Link } from '@tanstack/react-router'
import { BadgeSquare, periodLabel } from '@/features/badges/components/BadgePatch'
import { useAllPlayers } from '@/features/kitty/hooks'
import type { ClubMoment } from '../api'
import { momentTitle, type BadgeDrop } from '../feed'
import { shortDate } from './HonoursPostCard'

function Names({ drop }: { drop: BadgeDrop }) {
  const shown = drop.badges.slice(0, 3)
  const rest = drop.badges.length - shown.length
  return (
    <>
      {shown.map((b, i) => (
        <span key={b.id}>
          {i > 0 && (i === shown.length - 1 && rest === 0 ? ' and ' : ', ')}
          <Link to="/players/$playerId" params={{ playerId: b.player_id }} className="font-bold text-astro-text-muted hover:text-astro-text hover:underline">
            {b.nickname}
          </Link>
        </span>
      ))}
      {rest > 0 && ` and ${rest} more`}
    </>
  )
}

export function BadgeDropRow({ drop }: { drop: BadgeDrop }) {
  const first = drop.badges[0]
  const shared = drop.badges.length > 1
  const lead = first.tier === 'cup' ? 'won by' : shared ? 'shared by' : 'to'
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-astro-surface-sunken px-3.5 py-2.5">
      <BadgeSquare badge={first} size={30} />
      <div className="min-w-0 flex-1 text-[13.5px] leading-snug text-astro-text-dim">
        <Link to="/awards/$awardKey" params={{ awardKey: first.badge_key }} className="font-extrabold text-astro-text hover:underline">
          {first.def.name}
        </Link>
        {first.tier === 'month' && <span className="font-bold text-astro-cyan"> · {periodLabel(first)}</span>} {lead} <Names drop={drop} />
        {!shared && first.stat && <span> · {first.stat}</span>}
      </div>
      <div className="shrink-0 text-[11.5px] text-astro-text-dim">{shortDate(drop.at)}</div>
    </div>
  )
}

export function useMomentNames() {
  const { data: players = [] } = useAllPlayers()
  return new Map(players.map((p) => [p.id, p.nickname]))
}

export function MomentRow({ moment, names }: { moment: ClubMoment; names: Map<string, string> }) {
  const title = momentTitle(moment, moment.player_id ? names.get(moment.player_id) : undefined)
  const sub =
    moment.kind === 'matchdays'
      ? [moment.detail, shortDate(moment.happened_at)].filter(Boolean).join(' · ')
      : shortDate(moment.happened_at)
  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-[rgba(74,222,128,0.35)] bg-[linear-gradient(110deg,rgba(74,222,128,0.12),transparent_70%)] px-5 py-3.5">
      <div className="font-display text-[46px] leading-[0.85] text-astro-green">{moment.value.toLocaleString('en-GB')}</div>
      <div className="min-w-0">
        <div className="font-display text-[22px] leading-none text-astro-text">
          {moment.player_id ? (
            <Link to="/players/$playerId" params={{ playerId: moment.player_id }} className="hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </div>
        <div className="mt-0.5 text-[12px] text-astro-text-muted">{sub}</div>
      </div>
    </div>
  )
}
