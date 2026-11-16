import { toast } from 'sonner'
import { withConfirm } from '@/components/dialogs/confirm'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useAllPlayers } from '@/features/kitty/hooks'
import { useConfirmedPlayers } from '@/features/matchday/draw/useConfirmedPlayers'
import { CaptainsSetup } from './CaptainsSetup'
import { useCancelDraft, useDraft, usePickPlayer, usePublishDraft, useUndoPick } from './hooks'
import { SelectionBoard } from './SelectionBoard'

const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

/** The admin's view of captains' pick: set it up, run it (picking for a captain when needed), then publish the teams. */
export function DraftAdminPanel({ matchdayId }: { matchdayId: string }) {
  const { data: draft } = useDraft(matchdayId)
  const { data: confirmed = [] } = useConfirmedPlayers(matchdayId)
  const { data: roster = [] } = useAllPlayers()
  const { player } = useCurrentPlayer()
  const pick = usePickPlayer(matchdayId)
  const undo = useUndoPick(matchdayId)
  const cancel = useCancelDraft(matchdayId)
  const publish = usePublishDraft(matchdayId)

  const nameOf = (id: string) => confirmed.find((p) => p.id === id)?.nickname ?? roster.find((p) => p.id === id)?.nickname ?? 'Former player'
  const session = draft?.session
  if (!session || !draft) return <CaptainsSetup matchdayId={matchdayId} confirmed={confirmed} />

  const busy = pick.isPending || undo.isPending || cancel.isPending || publish.isPending
  const complete = session.status === 'complete'

  return (
    <div className="flex flex-col gap-4">
      <SelectionBoard
        state={draft}
        nameOf={nameOf}
        meId={player?.id ?? null}
        isAdmin
        tone="admin"
        busy={busy}
        onPick={(playerId) => pick.mutate({ sessionId: session.id, playerId }, { onError: (e) => toast.error(errText(e, 'Couldn’t make that pick.')) })}
      />

      {complete && (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            withConfirm(
              {
                tone: 'admin',
                eyebrow: 'Captains pick',
                title: 'Publish these teams?',
                body: 'Posts the sides to the feed, tells every player their team and brings the Community back. You can still swap players at check-in.',
                confirmLabel: 'Publish',
              },
              () =>
                publish.mutate(draft, {
                  onSuccess: () => toast.success('Teams are out'),
                  onError: (e) => toast.error(errText(e, 'Couldn’t publish the teams.')),
                }),
            )
          }
          className="min-h-12 rounded-[12px] bg-astro-cyan text-[15px] font-extrabold text-[#04121d] disabled:opacity-40"
        >
          Publish teams
        </button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy || draft.picks.length === 0}
          onClick={() => undo.mutate(session.id, { onError: (e) => toast.error(errText(e, 'Couldn’t undo that.')) })}
          className="min-h-11 rounded-[12px] border border-white/[0.14] text-[13.5px] font-extrabold text-astro-text disabled:opacity-40"
        >
          Undo last pick
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            withConfirm(
              {
                tone: 'danger',
                eyebrow: 'Captains pick',
                title: 'Cancel the selection?',
                body: 'Every pick so far is thrown away and the Community comes back. You can start again or switch to another way of making the teams.',
                confirmLabel: 'Cancel selection',
              },
              () => cancel.mutate(session.id, { onError: (e) => toast.error(errText(e, 'Couldn’t cancel it.')) }),
            )
          }
          className="min-h-11 rounded-[12px] border border-astro-red/50 text-[13.5px] font-extrabold text-astro-red hover:bg-astro-red/[0.1] disabled:opacity-40"
        >
          Cancel selection
        </button>
      </div>
    </div>
  )
}
