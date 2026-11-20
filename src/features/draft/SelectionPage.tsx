import { toast } from 'sonner'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useAllPlayers } from '@/features/kitty/hooks'
import { useDraft, usePickPlayer } from './hooks'
import { SelectionBoard } from './SelectionBoard'

/** What the Community shows while captains are picking: names only, no feed and no composer. */
export function SelectionPage({ matchdayId }: { matchdayId: string }) {
  const { data: draft, isLoading, isError, refetch } = useDraft(matchdayId)
  const { data: roster = [] } = useAllPlayers()
  const { player } = useCurrentPlayer()
  const pick = usePickPlayer(matchdayId)

  if (isLoading) return <PageLoader />
  if (isError || !draft?.session) return <ErrorState onRetry={() => refetch()} />

  const session = draft.session
  const nameOf = (id: string) => roster.find((p) => p.id === id)?.nickname ?? 'Former player'

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Community</h1>
      <p className="mb-6 text-sm text-astro-text-muted">Quiet while the captains pick. The chat is back once the teams are out.</p>
      <SelectionBoard
        state={draft}
        nameOf={nameOf}
        meId={player?.id ?? null}
        isAdmin={!!player?.is_admin}
        busy={pick.isPending}
        onPick={(playerId) =>
          pick.mutate(
            { sessionId: session.id, playerId },
            { onError: (e) => toast.error(e instanceof Error ? e.message : 'Couldn’t make that pick.') },
          )
        }
      />
    </div>
  )
}
