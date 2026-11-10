import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { PullOutDialog } from '@/features/matchday/components/PullOutDialog'
import {
  useClaimWeeklySpot,
  useJoinStandby,
  useLeaveStandby,
  useSetAvailability,
  useWithdrawWeeklyClaim,
} from '@/features/matchday/hooks'
import type { Database } from '@/types/database'

type Matchday = Database['public']['Tables']['matchdays']['Row']

export interface MyMatchdayState {
  isMonthlyMember: boolean
  monthlyOptStatus: 'in' | 'out' | null
  hasWeeklyClaim: boolean
  isOnStandby: boolean
}

function StatusLine({ playerId, me }: { playerId: string | null; me: MyMatchdayState }) {
  if (!playerId) return <>Sign in to claim a spot</>
  if (me.isMonthlyMember && me.monthlyOptStatus === 'out')
    return (
      <>
        You&rsquo;ve said you <span className="font-extrabold text-astro-red">CAN&rsquo;T</span> make it
      </>
    )
  if (me.isMonthlyMember || me.hasWeeklyClaim)
    return (
      <>
        You&rsquo;re <span className="font-extrabold text-astro-green">IN</span>
        {me.isMonthlyMember && <span className="text-astro-text-dim"> &middot; monthly</span>}
      </>
    )
  if (me.isOnStandby)
    return (
      <>
        You&rsquo;re on <span className="font-extrabold text-astro-text">STANDBY</span>
      </>
    )
  return <>You haven&rsquo;t claimed a spot yet</>
}

function PullOut({ matchdayId, playerId, kind }: { matchdayId: string; playerId: string; kind: 'claim' | 'standby' }) {
  const [open, setOpen] = useState(false)
  const withdraw = useWithdrawWeeklyClaim(matchdayId)
  const leave = useLeaveStandby(matchdayId)
  const mutation = kind === 'claim' ? withdraw : leave

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-astro-text-dim hover:text-astro-red"
      >
        {kind === 'claim' ? 'Pull out' : 'Leave standby'}
      </button>
      <PullOutDialog
        kind={kind}
        open={open}
        onOpenChange={setOpen}
        isPending={mutation.isPending}
        onConfirm={() =>
          mutation.mutate(playerId, {
            onSuccess: () => {
              setOpen(false)
              toast.success(kind === 'claim' ? "You've pulled out" : "You've left standby")
            },
            onError: () => toast.error("Couldn't do that. Claims may have just closed."),
          })
        }
      />
    </>
  )
}

/** Mobile only: answer from Home without opening Matchday. */
function QuickActions({
  matchdayId,
  playerId,
  me,
  spotsRemaining,
}: {
  matchdayId: string
  playerId: string
  me: MyMatchdayState
  spotsRemaining: number
}) {
  const setAvailability = useSetAvailability(matchdayId)
  const claim = useClaimWeeklySpot(matchdayId)
  const joinStandby = useJoinStandby(matchdayId)
  const base = 'min-h-10 flex-1 rounded-[10px] px-3 text-[13px] font-extrabold transition-colors disabled:opacity-60'
  const idle = 'border border-white/[0.09] bg-astro-surface-2 text-astro-text-muted'

  if (me.isMonthlyMember) {
    const out = me.monthlyOptStatus === 'out'
    return (
      <div className="mt-3.5 flex gap-2 md:hidden">
        <button
          type="button"
          disabled={setAvailability.isPending}
          onClick={() => setAvailability.mutate({ playerId, status: 'in' })}
          className={`${base} ${out ? idle : 'bg-astro-green text-[#08130c]'}`}
        >
          I&rsquo;m in
        </button>
        <button
          type="button"
          disabled={setAvailability.isPending}
          onClick={() => setAvailability.mutate({ playerId, status: 'out' })}
          className={`${base} ${out ? 'bg-astro-red text-white' : idle}`}
        >
          Can&rsquo;t
        </button>
      </div>
    )
  }

  if (me.hasWeeklyClaim || me.isOnStandby) return null

  return spotsRemaining > 0 ? (
    <button
      type="button"
      disabled={claim.isPending}
      onClick={() => claim.mutate(playerId)}
      className={`${base} mt-3.5 w-full bg-astro-accent text-astro-on-accent md:hidden`}
    >
      {claim.isPending ? 'Claiming…' : `Claim a spot · ${spotsRemaining} left`}
    </button>
  ) : (
    <button
      type="button"
      disabled={joinStandby.isPending}
      onClick={() => joinStandby.mutate(playerId)}
      className={`${base} ${idle} mt-3.5 w-full md:hidden`}
    >
      {joinStandby.isPending ? 'Joining…' : 'Full · join standby'}
    </button>
  )
}

export function NextMatchdayCard({
  matchday,
  monthlyInCount,
  weeklyCount,
  standbyCount,
  spotsRemaining,
  playerId,
  me,
}: {
  matchday: Matchday
  monthlyInCount: number
  weeklyCount: number
  standbyCount: number
  spotsRemaining: number
  playerId: string | null
  me: MyMatchdayState
}) {
  const filled = monthlyInCount + weeklyCount
  const pct = (n: number) => `${Math.min(100, (n / matchday.capacity) * 100)}%`
  const played = new Date(matchday.played_at)
  const kickoff = played.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const kickoffTime = played.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="astro-card p-[22px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Next Matchday</h2>
        <div className="text-xs text-astro-text-dim">
          {kickoff} &middot; {kickoffTime}
        </div>
      </div>
      <div className="mb-3.5 rounded-xl bg-astro-surface-2 p-4">
        <div className="mb-2.5 text-xs text-astro-text-muted">
          {matchday.venue ?? 'Venue TBC'} &middot; 5-a-side
        </div>
        <div className="mb-2.5 flex items-center gap-3">
          <div className="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-full bg-astro-bg">
            {monthlyInCount > 0 && <div className="h-full bg-astro-cyan" style={{ width: pct(monthlyInCount) }} />}
            {weeklyCount > 0 && (
              <div className="h-full" style={{ width: pct(weeklyCount), background: 'linear-gradient(90deg,#7c22e0,#a63fff)' }} />
            )}
          </div>
          <div className="font-display text-2xl leading-none text-astro-text">
            {filled}
            <span className="text-astro-text-dim">/{matchday.capacity}</span>
          </div>
        </div>
        <div className="mb-2 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-[11.5px] text-astro-text-muted">
            <span className="size-[7px] rounded-[2px] bg-astro-cyan" />
            {monthlyInCount} monthly
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-astro-text-muted">
            <span className="size-[7px] rounded-[2px] bg-astro-accent" />
            {weeklyCount} claimed this week
          </div>
        </div>
        <div className="text-[12.5px] text-astro-text-muted">
          {matchday.status !== 'open'
            ? matchday.status === 'drawn'
              ? 'Teams drawn'
              : 'Claims closed'
            : spotsRemaining > 0
              ? `${spotsRemaining} left to claim`
              : 'Full'}{' '}
          &middot; {standbyCount} on standby
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-astro-text-muted">
          <span>
            <StatusLine playerId={playerId} me={me} />
          </span>
          {playerId && matchday.status === 'open' && (me.hasWeeklyClaim || me.isOnStandby) && (
            <PullOut matchdayId={matchday.id} playerId={playerId} kind={me.hasWeeklyClaim ? 'claim' : 'standby'} />
          )}
        </div>
        <Link to="/matchday" className="text-[13px] font-extrabold text-astro-accent">
          Ballot &rarr;
        </Link>
      </div>
      {matchday.status !== 'open' && (me.hasWeeklyClaim || (me.isMonthlyMember && me.monthlyOptStatus !== 'out')) && (
        <p className="mt-3 text-xs text-astro-text-dim [text-wrap:pretty]">
          Can&rsquo;t make it now? Tell an admin and find your own replacement.
        </p>
      )}
      {playerId && matchday.status === 'open' && (
        <QuickActions matchdayId={matchday.id} playerId={playerId} me={me} spotsRemaining={spotsRemaining} />
      )}
    </div>
  )
}
