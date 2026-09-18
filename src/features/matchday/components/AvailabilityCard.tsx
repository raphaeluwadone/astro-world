import { cn } from '@/lib/utils'
import { useSetAvailability } from '../hooks'

const BASE_BUTTON =
  'min-h-11 flex-1 rounded-[10px] px-4 text-sm font-extrabold transition-colors disabled:opacity-60'
const UNSELECTED_BUTTON = 'border border-border bg-astro-surface-2 text-astro-text'

export function AvailabilityCard({
  matchdayId,
  playerId,
  currentStatus,
  isOpen,
  daysUntil,
}: {
  matchdayId: string
  playerId: string | null
  currentStatus: 'in' | 'out' | null
  isOpen: boolean
  daysUntil: number
}) {
  const { mutate, isPending } = useSetAvailability(matchdayId)
  const disabled = !playerId || !isOpen || isPending

  return (
    <div
      className="relative overflow-hidden rounded-[18px] border-[1.5px] border-astro-accent/40 p-6"
      style={{
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 26px), calc(100% - 26px) 100%, 0 100%)',
        background: 'linear-gradient(100deg, #2a1147 0%, #111a33 62%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, transparent 43%, rgba(255,255,255,0.09) 50%, transparent 57%)',
        }}
      />
      {daysUntil >= 0 && (
        <div
          className="astro-ghost pointer-events-none absolute -right-2.5 -top-[46px] text-[190px]"
          aria-hidden="true"
        >
          {daysUntil}
        </div>
      )}
      <div className="relative">
        <h2 className="font-display text-[26px] leading-none text-astro-text">
          ARE YOU OUT THIS SUNDAY?
        </h2>
        <p className="mt-2 text-sm text-astro-text-muted">
          No half-answers. Teams get drawn off this list.
        </p>

        {!playerId ? (
          <p className="mt-5 text-xs font-semibold text-astro-text-dim">
            Sign in to respond.
          </p>
        ) : !isOpen ? (
          <p className="mt-5 text-xs font-semibold text-astro-text-dim">
            The ballot for this matchday is no longer open.
          </p>
        ) : (
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={disabled}
              onClick={() => mutate({ playerId: playerId!, status: 'in' })}
              className={cn(BASE_BUTTON, currentStatus !== 'in' && UNSELECTED_BUTTON)}
              style={currentStatus === 'in' ? { background: '#4ade80', color: '#08130c' } : undefined}
            >
              I&rsquo;m in
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => mutate({ playerId: playerId!, status: 'out' })}
              className={cn(BASE_BUTTON, currentStatus !== 'out' && UNSELECTED_BUTTON)}
              style={currentStatus === 'out' ? { background: '#e0483f', color: '#fff' } : undefined}
            >
              Can&rsquo;t make it
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
