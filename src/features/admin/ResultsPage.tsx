import { confirmAction } from '@/components/dialogs/confirm'
import { Link } from '@tanstack/react-router'
import { Scene } from '@/components/states/Scene'
import { AstroSelect } from '@/components/ui/astro-select'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { useDrawnTeams, useNextMatchday } from '@/features/matchday/hooks'
import type { PlayerSummary, TeamWithMembers } from '@/features/matchday/api'
import { useFileMatchdayResults } from './hooks'
import type { PitchState } from './pitch/api'
import { usePitch } from './pitch/hooks'
import type { FixtureInput, GoalInput } from './results'

interface GoalDraft {
  teamId: string
  scorerId: string
  assistId: string
  /** Scored by someone on the other side; teamId is still the side that benefits. */
  ownGoal: boolean
}

interface CardDraft {
  teamId: string
  playerId: string
  kind: 'yellow' | 'red'
  minute: number | null
}

interface FixtureDraft {
  teamAId: string
  teamBId: string
  scoreA: string
  scoreB: string
  goals: GoalDraft[]
  cards: CardDraft[]
}

function emptyFixture(teams: TeamWithMembers[]): FixtureDraft {
  return { teamAId: teams[0]?.id ?? '', teamBId: teams[1]?.id ?? '', scoreA: '', scoreB: '', goals: [], cards: [] }
}

function fromPitch(pitch: PitchState | undefined): FixtureDraft[] | null {
  const done = pitch?.games.filter((g) => g.ended_at) ?? []
  if (done.length === 0) return null
  return done.map((g) => ({
    teamAId: g.team_a_id,
    teamBId: g.team_b_id,
    scoreA: String(g.goals.filter((x) => x.team_id === g.team_a_id).length),
    scoreB: String(g.goals.filter((x) => x.team_id === g.team_b_id).length),
    goals: g.goals.map((x) => ({ teamId: x.team_id, scorerId: x.scorer_id ?? '', assistId: x.assist_id ?? '', ownGoal: x.own_goal })),
    // The database re-adds the red for a second yellow when the cards are filed.
    cards: g.cards.filter((c) => !c.second_yellow).map((c) => ({ teamId: c.team_id, playerId: c.player_id, kind: c.kind, minute: c.minute })),
  }))
}

function emptyGoal(teamId: string): GoalDraft {
  return { teamId, scorerId: '', assistId: '', ownGoal: false }
}

const CARD_COLOUR = { yellow: '#facc15', red: '#ef4444' } as const

function TeamGoals({
  team,
  opponents,
  goals,
  onAdd,
  onChange,
  onRemove,
  cards,
  onAddCard,
  onChangeCard,
  onRemoveCard,
}: {
  team: TeamWithMembers | undefined
  opponents: PlayerSummary[]
  goals: { g: GoalDraft; gi: number }[]
  onAdd: () => void
  onChange: (goalIndex: number, patch: Partial<GoalDraft>) => void
  onRemove: (goalIndex: number) => void
  cards: { c: CardDraft; ci: number }[]
  onAddCard: () => void
  onChangeCard: (cardIndex: number, patch: Partial<CardDraft>) => void
  onRemoveCard: (cardIndex: number) => void
}) {
  if (!team) return null
  const members: PlayerSummary[] = team.members
  return (
    <div className="rounded-xl border bg-astro-bg/50 p-3" style={{ borderColor: `color-mix(in srgb, ${team.colour} 35%, transparent)` }}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: team.colour }} aria-hidden />
        <span className="truncate text-[13px] font-extrabold text-astro-text">{team.greek_name}</span>
        <span className="ml-auto text-[11px] font-bold text-astro-text-dim">
          {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {goals.map(({ g, gi }) => (
          <div key={gi} className="flex items-center gap-1.5">
            <button
              type="button"
              aria-pressed={g.ownGoal}
              aria-label="Own goal"
              title="Own goal"
              onClick={() => onChange(gi, { ownGoal: !g.ownGoal, scorerId: '', assistId: '' })}
              className={
                g.ownGoal
                  ? 'h-8 shrink-0 rounded-[7px] border border-astro-red/60 bg-astro-red/15 px-1.5 text-[10.5px] font-extrabold text-astro-red'
                  : 'h-8 shrink-0 rounded-[7px] border border-white/[0.1] px-1.5 text-[10.5px] font-extrabold text-astro-text-dim hover:text-astro-text'
              }
            >
              OG
            </button>
            <AstroSelect
              size="sm"
              placeholder={g.ownGoal ? 'Who put it in?' : 'Scorer'}
              aria-label={g.ownGoal ? `Own goal for ${team.greek_name}, by` : `${team.greek_name} scorer`}
              value={g.scorerId}
              onValueChange={(v) => onChange(gi, { scorerId: v, assistId: g.assistId === v ? '' : g.assistId })}
              options={(g.ownGoal ? opponents : members).map((p) => ({ value: p.id, label: p.nickname }))}
              className="min-w-0 flex-1"
            />
            {g.ownGoal ? (
              <span className="min-w-0 flex-1 truncate px-1 text-[11.5px] font-bold text-astro-text-dim">Own goal, no assist</span>
            ) : (
              <AstroSelect
                size="sm"
                placeholder="No assist"
                aria-label={`${team.greek_name} assist`}
                value={g.assistId}
                onValueChange={(v) => onChange(gi, { assistId: v })}
                options={[
                  { value: '', label: 'No assist' },
                  ...members.filter((p) => p.id !== g.scorerId).map((p) => ({ value: p.id, label: p.nickname })),
                ]}
                className="min-w-0 flex-1"
              />
            )}
            <button
              type="button"
              aria-label="Remove goal"
              onClick={() => onRemove(gi)}
              className="px-1 text-sm font-bold text-astro-text-dim hover:text-astro-red"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2.5 text-xs font-bold hover:underline"
        style={{ color: team.colour }}
      >
        + Goal for {team.greek_name}
      </button>
      {cards.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
          {cards.map(({ c, ci }) => (
            <div key={ci} className="flex items-center gap-1.5">
              {(['yellow', 'red'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-label={`${kind} card`}
                  aria-pressed={c.kind === kind}
                  onClick={() => onChangeCard(ci, { kind })}
                  className="h-7 w-5 shrink-0 rounded-[3px] border-2"
                  style={{ background: c.kind === kind ? CARD_COLOUR[kind] : 'transparent', borderColor: CARD_COLOUR[kind] }}
                />
              ))}
              <AstroSelect
                size="sm"
                placeholder="Player"
                aria-label={`${team.greek_name} card`}
                value={c.playerId}
                onValueChange={(v) => onChangeCard(ci, { playerId: v })}
                options={members.map((p) => ({ value: p.id, label: p.nickname }))}
                className="min-w-0 flex-1"
              />
              <button type="button" aria-label="Remove card" onClick={() => onRemoveCard(ci)} className="px-1 text-sm font-bold text-astro-text-dim hover:text-astro-red">
                &times;
              </button>
            </div>
          ))}
          {cards.some(({ c }) => c.kind === 'yellow' && c.playerId && cards.filter(({ c: o }) => o.kind === 'yellow' && o.playerId === c.playerId).length >= 2) && (
            <p className="text-[11.5px] text-astro-text-dim">Two yellows for one player also records a red when you file.</p>
          )}
        </div>
      )}
      <button type="button" onClick={onAddCard} className="mt-2 block text-xs font-bold text-astro-text-muted hover:text-astro-text hover:underline">
        + Card
      </button>
    </div>
  )
}

export function ResultsPage() {
  const { data: matchday, isLoading: matchdayLoading, isError: matchdayError, refetch: refetchMatchday } = useNextMatchday()
  const { data: teams = [], isLoading: teamsLoading, isError: teamsError, refetch: refetchTeams } = useDrawnTeams(matchday?.id)
  const fileResults = useFileMatchdayResults(matchday?.id)
  const { data: pitch, isLoading: pitchLoading } = usePitch(matchday?.status === 'drawn' ? matchday.id : undefined)

  const [fixtures, setFixtures] = useState<FixtureDraft[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (matchdayLoading || teamsLoading || pitchLoading) return <PageLoader />
  if (matchdayError) return <ErrorState onRetry={() => refetchMatchday()} />
  if (teamsError) return <ErrorState onRetry={() => refetchTeams()} />

  // Checked before the "nothing to file" guard below: filing results
  // invalidates the matchday query, so by the time this re-renders,
  // `matchday` has already moved past 'drawn' and would otherwise trip
  // that guard and hide the confirmation right after a successful submit.
  if (fileResults.isSuccess) {
    return (
      <div>
        <h1 className="mb-2.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
          Filed.
        </h1>
        <p className="mb-6 text-sm text-astro-text-muted">
          Ratings are now open for anyone who played. The league table and profiles pick this up automatically.
        </p>
        <Link to="/matchday" className="text-sm font-semibold text-astro-accent">
          Back to the matchday &rarr;
        </Link>
      </div>
    )
  }

  if (!matchday || matchday.status !== 'drawn') {
    return (
      <div>
        <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
          File results
        </h1>
        <EmptyState
          icon={<Scene kind="whistle" />}
          title="Nothing to file."
          body="There's no drawn matchday waiting on results right now."
        />
      </div>
    )
  }

  const pitchDraft = fromPitch(pitch)
  const draft = fixtures ?? pitchDraft ?? [emptyFixture(teams)]
  const checkedIn = [...(pitch?.checkedIn ?? [])]

  function updateFixture(index: number, patch: Partial<FixtureDraft>) {
    setFixtures(draft.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  function addFixture() {
    setFixtures([...draft, emptyFixture(teams)])
  }

  function removeFixture(index: number) {
    setFixtures(draft.filter((_, i) => i !== index))
  }

  function addGoal(fixtureIndex: number, teamId: string) {
    const f = draft[fixtureIndex]
    updateFixture(fixtureIndex, { goals: [...f.goals, emptyGoal(teamId)] })
  }

  function updateGoal(fixtureIndex: number, goalIndex: number, patch: Partial<GoalDraft>) {
    const f = draft[fixtureIndex]
    updateFixture(fixtureIndex, {
      goals: f.goals.map((g, i) => (i === goalIndex ? { ...g, ...patch } : g)),
    })
  }

  function removeGoal(fixtureIndex: number, goalIndex: number) {
    const f = draft[fixtureIndex]
    updateFixture(fixtureIndex, { goals: f.goals.filter((_, i) => i !== goalIndex) })
  }

  function addCard(fixtureIndex: number, teamId: string) {
    const f = draft[fixtureIndex]
    updateFixture(fixtureIndex, { cards: [...f.cards, { teamId, playerId: '', kind: 'yellow', minute: null }] })
  }

  function updateCard(fixtureIndex: number, cardIndex: number, patch: Partial<CardDraft>) {
    const f = draft[fixtureIndex]
    updateFixture(fixtureIndex, { cards: f.cards.map((c, i) => (i === cardIndex ? { ...c, ...patch } : c)) })
  }

  function removeCard(fixtureIndex: number, cardIndex: number) {
    const f = draft[fixtureIndex]
    updateFixture(fixtureIndex, { cards: f.cards.filter((_, i) => i !== cardIndex) })
  }

  async function submit() {
    setError(null)
    for (const f of draft) {
      if (!f.teamAId || !f.teamBId || f.teamAId === f.teamBId) {
        setError('Every fixture needs two different sides.')
        return
      }
      if (f.scoreA === '' || f.scoreB === '') {
        setError('Every fixture needs a final score.')
        return
      }
      const over = [f.teamAId, f.teamBId].some(
        (id, side) => f.goals.filter((g) => g.teamId === id).length > Number(side === 0 ? f.scoreA : f.scoreB),
      )
      if (over) {
        setError('A side has more goals listed than its score.')
        return
      }
      for (const g of f.goals) {
        if (!g.scorerId) {
          setError('Every goal needs a scorer.')
          return
        }
      }
      if (f.cards.some((c) => !c.playerId)) {
        setError('Every card needs a player.')
        return
      }
    }

    const fixtures: FixtureInput[] = draft.map((f) => ({
      teamAId: f.teamAId,
      teamBId: f.teamBId,
      scoreA: Number(f.scoreA),
      scoreB: Number(f.scoreB),
      goals: f.goals.map(
        (g): GoalInput => ({
          teamId: g.teamId,
          scorerId: g.scorerId,
          assistId: g.ownGoal ? null : g.assistId || null,
          ownGoal: g.ownGoal,
        }),
      ),
      cards: f.cards.filter((c) => c.teamId === f.teamAId || c.teamId === f.teamBId),
    }))

    const ok = await confirmAction({ tone: 'admin', eyebrow: 'Results', title: 'File these results?', body: `${fixtures.length} game${fixtures.length === 1 ? '' : 's'} and ${checkedIn.length} players. Stats update for everyone and ratings open.`, confirmLabel: 'File results' })
    if (!ok) return
    try {
      await fileResults.mutateAsync({ fixtures, checkedIn })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
        Whatever actually happened on the pitch
      </div>
      <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
        File results
      </h1>
      {pitchDraft && (
        <p className="mb-5 max-w-2xl rounded-xl border border-astro-cyan/35 bg-astro-cyan/[0.07] px-4 py-3 text-[13px] text-astro-text-muted">
          <span className="font-bold text-astro-text">Filled in from Pitch-side.</span> Check it over, add any missing scorers, then file.
          {checkedIn.length > 0 && ` Only the ${checkedIn.length} players checked in will be recorded as playing.`}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {draft.map((fixture, fi) => {
          return (
            <div key={fi} className="astro-card max-w-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
                  Fixture {fi + 1}
                </div>
                {draft.length > 1 && (
                  <button type="button" onClick={() => removeFixture(fi)} className="text-xs font-bold text-astro-text-dim hover:text-astro-red">
                    Remove
                  </button>
                )}
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2.5">
                <AstroSelect
                  aria-label="Home team"
                  value={fixture.teamAId}
                  onValueChange={(v) => updateFixture(fi, { teamAId: v, goals: fixture.goals.filter((g) => g.teamId !== fixture.teamAId), cards: fixture.cards.filter((c) => c.teamId !== fixture.teamAId) })}
                  options={teams.map((t) => ({ value: t.id, label: t.greek_name }))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="0"
                  value={fixture.scoreA}
                  onChange={(e) => updateFixture(fi, { scoreA: e.target.value })}
                  className="font-display w-14 shrink-0 rounded-[10px] border border-white/10 bg-astro-surface-2 px-2 py-3 text-center text-xl text-astro-text"
                />
                <span className="shrink-0 text-astro-text-dim">&ndash;</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="0"
                  value={fixture.scoreB}
                  onChange={(e) => updateFixture(fi, { scoreB: e.target.value })}
                  className="font-display w-14 shrink-0 rounded-[10px] border border-white/10 bg-astro-surface-2 px-2 py-3 text-center text-xl text-astro-text"
                />
                <AstroSelect
                  aria-label="Away team"
                  value={fixture.teamBId}
                  onValueChange={(v) => updateFixture(fi, { teamBId: v, goals: fixture.goals.filter((g) => g.teamId !== fixture.teamBId), cards: fixture.cards.filter((c) => c.teamId !== fixture.teamBId) })}
                  options={teams.map((t) => ({ value: t.id, label: t.greek_name }))}
                  className="flex-1"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[fixture.teamAId, fixture.teamBId].map((teamId, side) => (
                  <TeamGoals
                    key={side}
                    team={teams.find((t) => t.id === teamId)}
                    opponents={teams.find((t) => t.id === (side === 0 ? fixture.teamBId : fixture.teamAId))?.members ?? []}
                    goals={fixture.goals.map((g, gi) => ({ g, gi })).filter(({ g }) => g.teamId === teamId)}
                    onAdd={() => addGoal(fi, teamId)}
                    onChange={(gi, patch) => updateGoal(fi, gi, patch)}
                    onRemove={(gi) => removeGoal(fi, gi)}
                    cards={fixture.cards.map((c, ci) => ({ c, ci })).filter(({ c }) => c.teamId === teamId)}
                    onAddCard={() => addCard(fi, teamId)}
                    onChangeCard={(ci, patch) => updateCard(fi, ci, patch)}
                    onRemoveCard={(ci) => removeCard(fi, ci)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={addFixture}
          className="w-fit rounded-[11px] border border-border bg-astro-surface-2 px-[18px] py-3 text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
        >
          + Add fixture
        </button>

        {error && <p className="text-xs text-astro-red">{error}</p>}

        <Button onClick={submit} disabled={fileResults.isPending} className="w-fit">
          {fileResults.isPending ? 'Filing…' : 'File results'}
        </Button>
      </div>
    </div>
  )
}
