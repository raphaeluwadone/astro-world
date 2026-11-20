import { withConfirm } from '@/components/dialogs/confirm'
import { CONFIRM_OPT_OUT } from '../confirmCopy'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PullOutDialog } from './PullOutDialog'
import { useSetAvailability } from '../hooks'
import { formatNaira } from '@/features/payments/api'
import { toast } from 'sonner'
import { formatDeadline } from '../payDeadline'

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
  isWaived?: boolean
  isMonthlyPaid: boolean
  monthlyPrice: number | undefined
  payDeadline: Date
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
  isWaived = false,
  isMonthlyPaid,
  monthlyPrice,
  payDeadline,
  heldUntil,
  onPay,
  isPaying,
}: Props) {
  const { mutate: setMonthlyOptStatus, isPending: settingOptStatus } = useSetAvailability(_matchdayId)
  const [confirming, setConfirming] = useState<'claim' | 'standby' | null>(null)
  const isIn = hasWeeklyClaim || (isMonthlyMember && monthlyOptStatus !== 'out')
  const deadlineLabel = formatDeadline(payDeadline)
  const [now] = useState(Date.now)
  const pastDeadline = now >= payDeadline.getTime()
  const monthlyUnpaid = monthlyPrice !== undefined && !isMonthlyPaid
  const setOptStatus = (status: 'in' | 'out') =>
    setMonthlyOptStatus({ playerId: playerId!, status }, { onError: (e) => toast.error(e.message) })

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
            : 'First to pay gets the spot.'}
        </p>

        {!playerId ? (
          <p className="mt-5 text-xs font-semibold text-astro-text-dim">Sign in to respond.</p>
        ) : !isOpen ? (
          <p className="mt-5 text-xs font-semibold text-astro-text-dim [text-wrap:pretty]">
            {isIn
              ? 'Claims are closed. Can’t make it now? Tell an admin and find your own replacement.'
              : 'Spots for this matchday are no longer open.'}
          </p>
        ) : isMonthlyMember && monthlyOptStatus === 'out' && isOnStandby ? (
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-border bg-astro-surface-2 px-3.5 py-2 text-[12.5px] font-extrabold text-astro-text-muted">
                Sunday&rsquo;s full · standby{standbyPosition ? ` #${standbyPosition}` : ''}
              </div>
              {spotsRemaining > 0 && (
                <button
                  type="button"
                  disabled={settingOptStatus}
                  onClick={() => setOptStatus('in')}
                  className="rounded-[10px] px-3.5 py-2 text-[12.5px] font-extrabold disabled:opacity-60"
                  style={{ background: '#4ade80', color: '#08130c' }}
                >
                  A spot opened · I&rsquo;m in
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-astro-text-dim">Your monthly spot covers every Sunday after this one. If a spot opens here, you&rsquo;ll hear.</p>
          </div>
        ) : isMonthlyMember ? (
          <div className="mt-5">
          <div className="flex gap-3">
            <button
              type="button"
              disabled={settingOptStatus}
              onClick={() => setOptStatus('in')}
              className={cn(BASE_BUTTON, monthlyOptStatus !== 'out' ? undefined : UNSELECTED_BUTTON)}
              style={monthlyOptStatus !== 'out' ? { background: '#4ade80', color: '#08130c' } : undefined}
            >
              I&rsquo;m in
            </button>
            <button
              type="button"
              disabled={settingOptStatus}
              onClick={() => monthlyOptStatus !== 'out' && withConfirm(CONFIRM_OPT_OUT, () => setOptStatus('out'))}
              className={cn(BASE_BUTTON, monthlyOptStatus === 'out' ? undefined : UNSELECTED_BUTTON)}
              style={monthlyOptStatus === 'out' ? { background: '#e0483f', color: '#fff' } : undefined}
            >
              Can&rsquo;t make it
            </button>
          </div>
          {monthlyUnpaid && (
            <p className="mt-2 text-xs font-semibold text-astro-amber">
              {pastDeadline && monthlyOptStatus === 'out'
                ? `Dropped at ${deadlineLabel} for not paying. Pay for the month to get back in.`
                : `Not paid yet. Pay by ${deadlineLabel} or this Sunday’s spot goes to standby.`}
            </p>
          )}
          </div>
        ) : hasWeeklyClaim ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[rgba(74,222,128,0.45)] bg-[rgba(74,222,128,0.14)] px-3.5 py-2 text-[12.5px] font-extrabold text-[#4ade80]">
              You&rsquo;re in
            </div>
            {isPaid ? (
              <div className="rounded-full border border-[rgba(74,222,128,0.45)] px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#4ade80]">
                {isWaived ? 'Covered by an admin' : 'Paid'}
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
            {!isPaid && weeklyPrice !== undefined && (
              <p className="basis-full text-xs font-semibold text-astro-amber">Pay by {deadlineLabel} or your spot goes to standby.</p>
            )}
          </div>
        ) : isOnStandby && spotsRemaining <= 0 ? (
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
            <p className="basis-full text-xs text-astro-text-dim">You only pay if a spot opens and you take it.</p>
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
            {isOnStandby && <p className="basis-full text-xs font-semibold text-astro-green">A spot opened. First to claim it plays.</p>}
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
              className="min-h-11 px-3 text-xs font-bold text-astro-text-muted hover:text-astro-text disabled:opacity-60"
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
          <>
          <button
            type="button"
            disabled={isJoiningStandby}
            onClick={onJoinStandby}
            className="mt-5 rounded-[11px] border border-border bg-astro-surface-2 px-[18px] py-3 text-[13px] font-extrabold text-astro-text disabled:opacity-60"
          >
            {isJoiningStandby ? 'Joining…' : 'Spots are full · join standby'}
          </button>
          <p className="mt-2 max-w-md text-xs text-astro-text-dim [text-wrap:pretty]">
            Every weekly spot is taken. Standby is free: you pay only if a spot opens and you take it. Paying for the month now would also start you on standby for this Sunday.
          </p>
          </>
        )}
      </div>
      <PullOutDialog
        kind={confirming === 'claim' && isPaid && !isWaived ? 'paidClaim' : (confirming ?? 'claim')}
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
