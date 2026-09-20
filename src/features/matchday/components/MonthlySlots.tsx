import type { AvailabilityRow, MonthlyMemberRow } from '../api'

const MAX_MONTHLY_SLOTS = 10

export function MonthlySlots({
  members,
  monthLabel,
  playerId,
  onClaim,
  isClaiming,
  availability = [],
}: {
  members: MonthlyMemberRow[]
  monthLabel: string
  playerId: string | null
  onClaim: () => void
  isClaiming: boolean
  availability?: AvailabilityRow[]
}) {
  const alreadyClaimed = !!playerId && members.some((m) => m.player_id === playerId)
  const full = members.length >= MAX_MONTHLY_SLOTS
  const outThisWeek = new Set(availability.filter((a) => a.status === 'out').map((a) => a.player_id))

  return (
    <div className="astro-card p-[22px]">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Monthly Slots</h2>
        <div className="font-display text-2xl leading-none text-astro-accent">
          {members.length}
          <span className="text-astro-text-dim">/{MAX_MONTHLY_SLOTS}</span>
        </div>
      </div>
      <p className="mb-3.5 text-[13px] text-astro-text-muted">
        First {MAX_MONTHLY_SLOTS} to claim hold their spot for every Sunday in {monthLabel}, no
        need to mark in weekly. First come, first served, never random.
      </p>

      {members.length > 0 && (
        <div className="mb-3.5 flex flex-col gap-1.5">
          {members.map((m) => (
            <div key={m.player_id} className="flex items-center gap-2.5 rounded-lg bg-astro-surface-2 px-3 py-2">
              <div
                className="size-7 shrink-0 rounded-lg"
                style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-astro-text">{m.players.nickname}</span>
              {outThisWeek.has(m.player_id) && (
                <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.06em] text-astro-red">
                  Out this week
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {playerId && !alreadyClaimed && !full && (
        <button
          type="button"
          disabled={isClaiming}
          onClick={onClaim}
          className="w-full rounded-[11px] bg-astro-accent px-[18px] py-3 text-[13px] font-extrabold text-astro-on-accent disabled:opacity-60"
        >
          {isClaiming ? 'Claiming…' : `Claim your spot for ${monthLabel}`}
        </button>
      )}
      {alreadyClaimed && (
        <div className="text-[12.5px] font-bold text-astro-green">You&rsquo;re in for {monthLabel}.</div>
      )}
      {!alreadyClaimed && full && (
        <div className="text-[12.5px] text-astro-text-dim">All {MAX_MONTHLY_SLOTS} monthly spots are taken.</div>
      )}
    </div>
  )
}
