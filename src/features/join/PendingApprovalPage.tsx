import { Link } from '@tanstack/react-router'
import { useSession } from '@/features/auth/useSession'
import { PageLoader } from '@/components/states/PageLoader'
import { useMyLatestClaim } from './hooks'

export function PendingApprovalPage() {
  const { session } = useSession()
  const { data: claim, isLoading, isError, error } = useMyLatestClaim(session?.user.id)

  if (isLoading) return <PageLoader />

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-astro-bg px-6">
        <div className="astro-card max-w-[440px] p-8 text-center">
          <h1 className="font-display mb-2.5 text-4xl leading-none text-astro-text">
            Couldn&rsquo;t load your claim
          </h1>
          <p className="text-sm text-astro-red">
            {error instanceof Error ? error.message : 'Something went wrong.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-astro-bg px-6">
      <div className="astro-card max-w-[440px] p-8 text-center">
        {!claim || claim.status === 'pending' ? (
          <>
            <h1 className="font-display mb-2.5 text-4xl leading-none text-astro-text">
              Sent to the admins
            </h1>
            <p className="mb-6 text-sm leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
              {claim
                ? `They'll confirm you're ${claim.players.nickname} and your record unlocks. Usually the same evening.`
                : "We couldn't find a pending claim for your account. If you think that's wrong, try joining again."}
            </p>
          </>
        ) : claim.status === 'approved' ? (
          <>
            <h1 className="font-display mb-2.5 text-4xl leading-none text-astro-text">You&rsquo;re in</h1>
            <p className="mb-6 text-sm leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
              An admin confirmed you&rsquo;re {claim.players.nickname}. Refresh to pick up where you
              left off.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display mb-2.5 text-4xl leading-none text-astro-text">
              That record wasn&rsquo;t you
            </h1>
            <p className="mb-6 text-sm leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
              You keep the account. Start fresh as a new player instead: nothing is lost except the
              record you didn&rsquo;t own.
            </p>
          </>
        )}
        <Link
          to="/join"
          className="inline-block rounded-xl bg-astro-accent px-6 py-3 text-sm font-extrabold text-astro-on-accent"
        >
          {claim?.status === 'rejected' ? 'Set up a new player' : 'Back to Join'}
        </Link>
      </div>
    </div>
  )
}
