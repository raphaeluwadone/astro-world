import { withConfirm } from '@/components/dialogs/confirm'
import { CONFIRM_OPT_OUT } from '../confirmCopy'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PullOutDialog } from './PullOutDialog'
import { useSetAvailability } from '../hooks'
import { formatNaira } from '@/features/payments/api'

const BASE_BUTTON =
  'min-h-11 flex-1 rounded-[10px] px-4 text-sm font-extrabold transition-colors disabled:opacity-60'
const UNSELECTED_BUTTON = 'border border-border bg-astro-surface-2 text-astro-text'

interface Props {
  matchdayId: string
  playerId: string | null
  isOpen: boolean
  daysUntil: number
  isMonthlyMember: boolean
  monthlyOptStatus: 'in' | 'out' | null
  hasWeeklyClaim: boolean
  isOnStandby: boolean
  standbyPosition: number | null
  spotsRemaining: number
  onClaim: () => void
  onWithdrawClaim: () => void
  onJoinStandby: () => void
  onLeaveStandby: () => void
  isClaiming: boolean
  isWithdrawing: boolean
  isJoiningStandby: boolean
  isLeavingStandby: boolean
  weeklyPrice: number | undefined
  isPaid: boolean
  heldUntil: string | null
  onPay: () => void
  isPaying: boolean
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export function AvailabilityCard({
  matchdayId: _matchdayId,
  playerId,
  isOpen,
  daysUntil,
  isMonthlyMember,
  monthlyOptStatus,
  hasWeeklyClaim,
  isOnStandby,
  standbyPosition,
  spotsRemaining,
  onClaim,
  onWithdrawClaim,
  onJoinStandby,
  onLeaveStandby,
  isClaiming,
  isWithdrawing,
  isJoiningStandby,
  isLeavingStandby,
  weeklyPrice,
  isPaid,
  heldUntil,
  onPay,
  isPaying,
}: Props) {
  const { mutate: setMonthlyOptStatus, isPending: settingOptStatus } = useSetAvailability(_matchdayId)
  const [confirming, setConfirming] = useState<'claim' | 'standby' | null>(null)
  const isIn = hasWeeklyClaim || (isMonthlyMember && monthlyOptStatus !== 'out')

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
          {isMonthlyMember ? 'YOU HOLD A MONTHLY SPOT' : 'CLAIM YOUR SUNDAY SPOT'}
        </h2>
        <p className="mt-2 text-sm text-astro-text-muted">
          {isMonthlyMember
            ? "You're in every Sunday this month. Only opt out if you genuinely can't make this one."
            : 'First to pay gets the spot. No half-answers, no ballot.'}
        </p>

        {!playerId ? (
          <p className="mt-5 text-xs font-semibold text-astro-text-dim">Sign in to respond.</p>
        ) : !isOpen ? (
          <p className="mt-5 text-xs font-semibold text-astro-text-dim [text-wrap:pretty]">
            {isIn
              ? 'Claims are closed. Can’t make it now? Tell an admin and find your own replacement.'
              : 'Spots for this matchday are no longer open.'}
          </p>
        ) : isMonthlyMember ? (
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={settingOptStatus}
              onClick={() => setMonthlyOptStatus({ playerId: playerId!, status: 'in' })}
              className={cn(BASE_BUTTON, monthlyOptStatus !== 'out' ? undefined : UNSELECTED_BUTTON)}
              style={monthlyOptStatus !== 'out' ? { background: '#4ade80', color: '#08130c' } : undefined}
            >
              I&rsquo;m in
            </button>
            <button
              type="button"
              disabled={settingOptStatus}
              onClick={() => monthlyOptStatus !== 'out' && withConfirm(CONFIRM_OPT_OUT, () => setMonthlyOptStatus({ playerId: playerId!, status: 'out' }))}
              className={cn(BASE_BUTTON, monthlyOptStatus === 'out' ? undefined : UNSELECTED_BUTTON)}
              style={monthlyOptStatus === 'out' ? { background: '#e0483f', color: '#fff' } : undefined}
            >
              Can&rsquo;t make it
            </button>
          </div>
        ) : hasWeeklyClaim ? (
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[rgba(74,222,128,0.45)] bg-[rgba(74,222,128,0.14)] px-3.5 py-2 text-[12.5px] font-extrabold text-[#4ade80]">
              You&rsquo;re in
            </div>
            {isPaid ? (
              <div className="rounded-full border border-[rgba(74,222,128,0.45)] px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#4ade80]">
                Paid
              </div>
            ) : (
              weeklyPrice !== undefined && (
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={onPay}
                  className="rounded-[10px] bg-astro-accent px-3.5 py-2 text-[12.5px] font-extrabold text-astro-on-accent disabled:opacity-60"
                >
                  {isPaying ? 'Opening Paystack…' : `Pay ${formatNaira(weeklyPrice)}`}
                </button>
              )
            )}
            <button
              type="button"
              disabled={isWithdrawing}
              onClick={() => setConfirming('claim')}
              className="text-xs font-bold text-astro-text-dim hover:text-astro-red"
            >
              Pull out
            </button>
          </div>
        ) : isOnStandby ? (
          <div className="mt-5 flex items-center gap-3">
            <div className="rounded-full border border-border bg-astro-surface-2 px-3.5 py-2 text-[12.5px] font-extrabold text-astro-text-muted">
              On standby{standbyPosition ? ` · #${standbyPosition}` : ''}
            </div>
            <button
              type="button"
              disabled={isLeavingStandby}
              onClick={() => setConfirming('standby')}
              className="text-xs font-bold text-astro-text-dim hover:text-astro-red"
            >
              Leave standby
            </button>
          </div>
        ) : heldUntil && weeklyPrice !== undefined ? (
          <div className="mt-5">
            <button
              type="button"
              disabled={isPaying}
              onClick={onPay}
              className="rounded-[11px] bg-astro-accent px-[18px] py-3 text-[13px] font-extrabold text-astro-on-accent disabled:opacity-60"
            >
              {isPaying ? 'Opening Paystack…' : `Finish paying ${formatNaira(weeklyPrice)}`}
            </button>
            <p className="mt-2 text-xs text-astro-text-dim">Your spot is held until {time(heldUntil)}. Paid already? It confirms within a minute.</p>
          </div>
        ) : spotsRemaining > 0 && weeklyPrice !== undefined ? (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              disabled={isPaying}
              onClick={onPay}
              className="rounded-[11px] bg-astro-accent px-[18px] py-3 text-[13px] font-extrabold text-astro-on-accent disabled:opacity-60"
            >
              {isPaying ? 'Opening Paystack…' : `Pay ${formatNaira(weeklyPrice)} · ${spotsRemaining} left`}
            </button>
            <button
              type="button"
              disabled={isClaiming}
              onClick={onClaim}
              className="text-xs font-bold text-astro-text-muted hover:text-astro-text disabled:opacity-60"
            >
              {isClaiming ? 'Claiming…' : 'Claim now, pay later'}
            </button>
          </div>
        ) : spotsRemaining > 0 ? (
          <button
            type="button"
            disabled={isClaiming}
            onClick={onClaim}
            className="mt-5 rounded-[11px] bg-astro-accent px-[18px] py-3 text-[13px] font-extrabold text-astro-on-accent disabled:opacity-60"
          >
            {isClaiming ? 'Claiming…' : `Claim your spot · ${spotsRemaining} left`}
          </button>
        ) : (
          <button
            type="button"
            disabled={isJoiningStandby}
            onClick={onJoinStandby}
            className="mt-5 rounded-[11px] border border-border bg-astro-surface-2 px-[18px] py-3 text-[13px] font-extrabold text-astro-text disabled:opacity-60"
          >
            {isJoiningStandby ? 'Joining…' : 'Spots are full · join standby'}
          </button>
        )}
      </div>
      <PullOutDialog
        kind={confirming === 'claim' && isPaid ? 'paidClaim' : (confirming ?? 'claim')}
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        isPending={confirming === 'claim' ? isWithdrawing : isLeavingStandby}
        onConfirm={() => {
          if (confirming === 'claim') onWithdrawClaim()
          else onLeaveStandby()
          setConfirming(null)
        }}
      />
    </div>
  )
}
