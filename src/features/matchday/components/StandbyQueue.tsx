import type { StandbyEntryRow, WeeklyClaimRow } from '../api'

export function StandbyQueue({
  weeklyClaims,
  standby,
}: {
  weeklyClaims: WeeklyClaimRow[]
  standby: StandbyEntryRow[]
}) {
  return (
    <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
      <div className="rounded-xl bg-astro-surface-2 p-3.5">
        <div className="astro-eyebrow mb-3">Confirmed (weekly) &middot; {weeklyClaims.length}</div>
        <div className="space-y-1.5">
          {weeklyClaims.map((e) => (
            <div key={e.player_id} className="text-sm font-semibold text-astro-text">
              {e.players.nickname}
            </div>
          ))}
          {weeklyClaims.length === 0 && (
            <div className="text-sm text-astro-text-dim">Nobody&rsquo;s paid for a weekly spot yet.</div>
          )}
        </div>
      </div>
      <div className="rounded-xl bg-astro-surface-2 p-3.5">
        <div className="astro-eyebrow mb-3">Standby &middot; {standby.length}</div>
        <div className="space-y-1.5">
          {standby.map((e, i) => (
            <div key={e.player_id} className="flex items-center gap-2 text-sm font-semibold text-astro-text">
              <span className="text-astro-text-dim">{i + 1}.</span>
              {e.players.nickname}
            </div>
          ))}
          {standby.length === 0 && <div className="text-sm text-astro-text-dim">Nobody on standby.</div>}
        </div>
      </div>
    </div>
  )
}
