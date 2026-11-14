import type { AvailabilityRow, MonthlyMemberRow } from '../api'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import { formatNaira } from '@/features/payments/api'

const MAX_MONTHLY_SLOTS = 10

export function MonthlySlots({
  members,
  monthLabel,
  playerId,
  onClaim,
  isClaiming,
  availability = [],
  price,
  isPaid,
  heldUntil,
  onPay,
  isPaying,
}: {
  members: MonthlyMemberRow[]
  monthLabel: string
  playerId: string | null
  onClaim: () => void
  isClaiming: boolean
  availability?: AvailabilityRow[]
  price: number | undefined
  isPaid: boolean
  heldUntil: string | null
  onPay: () => void
  isPaying: boolean
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
              <PlayerPhoto playerId={m.player_id} alt="" className="size-7 rounded-lg" />
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

      {playerId && !alreadyClaimed && heldUntil && price !== undefined ? (
        <>
          <button
            type="button"
            disabled={isPaying}
            onClick={onPay}
            className="w-full rounded-[11px] bg-astro-accent px-[18px] py-3 text-[13px] font-extrabold text-astro-on-accent disabled:opacity-60"
          >
            {isPaying ? 'Opening Paystack…' : `Finish paying ${formatNaira(price)}`}
          </button>
          <p className="mt-2 text-xs text-astro-text-dim">
            Held for you until {new Date(heldUntil).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.
          </p>
        </>
      ) : (
        playerId &&
        !alreadyClaimed &&
        !full && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              disabled={price !== undefined ? isPaying : isClaiming}
              onClick={price !== undefined ? onPay : onClaim}
              className="w-full rounded-[11px] bg-astro-accent px-[18px] py-3 text-[13px] font-extrabold text-astro-on-accent disabled:opacity-60"
            >
              {price !== undefined
                ? isPaying
                  ? 'Opening Paystack…'
                  : `Pay ${formatNaira(price)} for ${monthLabel}`
                : isClaiming
                  ? 'Claiming…'
                  : `Claim your spot for ${monthLabel}`}
            </button>
            {price !== undefined && (
              <button
                type="button"
                disabled={isClaiming}
                onClick={onClaim}
                className="text-xs font-bold text-astro-text-muted hover:text-astro-text disabled:opacity-60"
              >
                {isClaiming ? 'Claiming…' : 'Claim now, pay later'}
              </button>
            )}
          </div>
        )
      )}
      {alreadyClaimed && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[12.5px] font-bold text-astro-green">You&rsquo;re in for {monthLabel}.</div>
          {isPaid ? (
            <div className="rounded-full border border-[rgba(74,222,128,0.45)] px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-[#4ade80]">
              Paid
            </div>
          ) : (
            price !== undefined && (
              <button
                type="button"
                disabled={isPaying}
                onClick={onPay}
                className="rounded-[10px] bg-astro-accent px-3 py-1.5 text-xs font-extrabold text-astro-on-accent disabled:opacity-60"
              >
                {isPaying ? 'Opening Paystack…' : `Pay ${formatNaira(price)}`}
              </button>
            )
          )}
        </div>
      )}
      {!alreadyClaimed && full && (
        <div className="text-[12.5px] text-astro-text-dim">All {MAX_MONTHLY_SLOTS} monthly spots are taken.</div>
      )}
    </div>
  )
}
