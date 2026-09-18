import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { EmptyPitchIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { useApproveClaim, usePendingClaims, useRejectClaim } from './hooks'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function AdminClaimsPage() {
  const { player } = useCurrentPlayer()
  const { data: claims = [], isLoading } = usePendingClaims()
  const approve = useApproveClaim(player?.id)
  const reject = useRejectClaim(player?.id)

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
        A separate application, on purpose
      </div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
        Pending Claims
      </h1>
      <p className="mb-6 max-w-lg text-sm text-astro-text-muted">
        Records hold ratings other people voted for, so a claim on one waits here until an admin
        confirms it's genuinely that person. The rest of the Admin Portal (matchday control, cup
        squads, rules editor) isn't built yet: this is a real, working slice of it.
      </p>

      {isLoading ? (
        <PageLoader />
      ) : claims.length === 0 ? (
        <EmptyState icon={<EmptyPitchIcon />} title="Nothing to review." body="New claims will show up here." />
      ) : (
        <div className="flex flex-col gap-3">
          {claims.map((c) => (
            <div key={c.id} className="astro-card p-5">
              <div className="mb-3 flex flex-wrap items-center gap-3.5">
                <div
                  className="size-12 shrink-0 rounded-xl"
                  style={{ background: 'linear-gradient(140deg, #2c3c74, #182448)' }}
                />
                <div className="min-w-[160px] flex-1">
                  <div className="font-display text-2xl leading-none text-astro-text">
                    {c.players.nickname}
                  </div>
                  <div className="text-[12.5px] text-astro-text-muted">{c.players.full_name}</div>
                </div>
                <div className="text-xs text-astro-text-dim">
                  Requested {new Date(c.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2 text-xs text-astro-text-muted">
                {c.instagram_handle && (
                  <span className="rounded-lg bg-astro-surface-2 px-2.5 py-1">@{c.instagram_handle}</span>
                )}
                {c.birthday_month && (
                  <span className="rounded-lg bg-astro-surface-2 px-2.5 py-1">
                    Born {c.birthday_day ? `${c.birthday_day} ` : ''}
                    {MONTHS[c.birthday_month - 1]}
                  </span>
                )}
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={approve.isPending || reject.isPending}
                  onClick={() => approve.mutate(c)}
                  className="rounded-lg bg-astro-green px-4 py-2 text-xs font-extrabold text-[#08130c] disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={approve.isPending || reject.isPending}
                  onClick={() => reject.mutate(c.id)}
                  className="rounded-lg border border-border bg-astro-surface-2 px-4 py-2 text-xs font-bold text-astro-text-muted disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
