import { cn } from 'cn'
import { headlineBadges } from '../api'
import { useBadgesByPlayer } from '../hooks'
import { BadgeSquare } from './BadgePatch'

/** The player's top badge beside their name, plus a count of the rest. Weekly badges stay off it. */
export function BadgeMark({
  playerId,
  size = 16,
  max = 1,
  showExtra = true,
  className,
}: {
  playerId: string | null | undefined
  size?: number
  max?: number
  showExtra?: boolean
  className?: string
}) {
  const map = useBadgesByPlayer()
  if (!playerId) return null
  const shown = headlineBadges(map.get(playerId) ?? [])
  if (shown.length === 0) return null
  const extra = shown.length - max
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 align-middle', className)} onClick={(e) => e.stopPropagation()}>
      {shown.slice(0, max).map((b) => (
        <BadgeSquare key={b.id} badge={b} size={size} side="top" />
      ))}
      {showExtra && extra > 0 && <span className="text-[10px] font-extrabold text-astro-text-dim">+{extra}</span>}
    </span>
  )
}
