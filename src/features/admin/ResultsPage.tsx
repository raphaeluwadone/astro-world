import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyPitchIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { useDrawnTeams, useNextMatchday } from '@/features/matchday/hooks'
import type { PlayerSummary, TeamWithMembers } from '@/features/matchday/api'
import { useFileMatchdayResults } from './hooks'
import type { FixtureInput, GoalInput } from './results'

interface GoalDraft {
  teamId: string
  scorerId: string
  assistId: string
  minute: string
}

interface FixtureDraft {
  teamAId: string
  teamBId: string
  scoreA: string
  scoreB: string
  goals: GoalDraft[]
}

function emptyFixture(teams: TeamWithMembers[]): FixtureDraft {
  return { teamAId: teams[0]?.id ?? '', teamBId: teams[1]?.id ?? '', scoreA: '', scoreB: '', goals: [] }
}

function emptyGoal(teamId: string): GoalDraft {
  return { teamId, scorerId: '', assistId: '', minute: '' }
}

function membersOf(teams: TeamWithMembers[], teamId: string): PlayerSummary[] {
  return teams.find((t) => t.id === teamId)?.members ?? []
}

export function ResultsPage() {
  const { data: matchday, isLoading: matchdayLoading, isError: matchdayError, refetch: refetchMatchday } = useNextMatchday()
  const { data: teams = [], isLoading: teamsLoading, isError: teamsError, refetch: refetchTeams } = useDrawnTeams(matchday?.id)
  const fileResults = useFileMatchdayResults(matchday?.id)

  const [fixtures, setFixtures] = useState<FixtureDraft[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (matchdayLoading || teamsLoading) return <PageLoader />
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
          icon={<EmptyPitchIcon />}
          title="Nothing to file."
          body="There's no drawn matchday waiting on results right now."
        />
      </div>
    )
  }

  const draft = fixtures ?? [emptyFixture(teams)]

  function updateFixture(index: number, patch: Partial<FixtureDraft>) {
    setFixtures(draft.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  function addFixture() {
    setFixtures([...draft, emptyFixture(teams)])
  }

  function removeFixture(index: number) {
    setFixtures(draft.filter((_, i) => i !== index))
  }

  function addGoal(fixtureIndex: number) {
    const f = draft[fixtureIndex]
    updateFixture(fixtureIndex, { goals: [...f.goals, emptyGoal(f.teamAId)] })
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
      for (const g of f.goals) {
        if (!g.scorerId || g.minute === '') {
          setError('Every goal needs a scorer and a minute.')
          return
        }
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
          assistId: g.assistId || null,
          minute: Number(g.minute),
        }),
      ),
    }))

    try {
      await fileResults.mutateAsync(fixtures)
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

      <div className="flex flex-col gap-4">
        {draft.map((fixture, fi) => {
          const teamAMembers = membersOf(teams, fixture.teamAId)
          const teamBMembers = membersOf(teams, fixture.teamBId)
          const allMembers = [...teamAMembers, ...teamBMembers]
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
                <select
                  value={fixture.teamAId}
                  onChange={(e) => updateFixture(fi, { teamAId: e.target.value })}
                  className="min-w-0 flex-1 rounded-[10px] border border-white/10 bg-astro-surface-2 px-3 py-3 text-sm font-bold text-astro-text"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.greek_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={fixture.scoreA}
                  onChange={(e) => updateFixture(fi, { scoreA: e.target.value })}
                  className="font-display w-14 shrink-0 rounded-[10px] border border-white/10 bg-astro-surface-2 px-2 py-3 text-center text-xl text-astro-text"
                />
                <span className="shrink-0 text-astro-text-dim">&ndash;</span>
                <input
                  type="number"
                  min={0}
                  value={fixture.scoreB}
                  onChange={(e) => updateFixture(fi, { scoreB: e.target.value })}
                  className="font-display w-14 shrink-0 rounded-[10px] border border-white/10 bg-astro-surface-2 px-2 py-3 text-center text-xl text-astro-text"
                />
                <select
                  value={fixture.teamBId}
                  onChange={(e) => updateFixture(fi, { teamBId: e.target.value })}
                  className="min-w-0 flex-1 rounded-[10px] border border-white/10 bg-astro-surface-2 px-3 py-3 text-sm font-bold text-astro-text"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.greek_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
                Goals
              </div>
              <div className="mb-3 flex flex-col gap-2">
                {fixture.goals.map((goal, gi) => (
                  <div key={gi} className="flex flex-wrap items-center gap-2">
                    <select
                      value={goal.scorerId}
                      onChange={(e) => updateGoal(fi, gi, { scorerId: e.target.value })}
                      className="min-w-[120px] flex-1 rounded-lg border border-white/10 bg-astro-surface-2 px-2.5 py-2 text-xs font-bold text-astro-text"
                    >
                      <option value="">Scorer</option>
                      {allMembers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nickname}
                        </option>
                      ))}
                    </select>
                    <select
                      value={goal.assistId}
                      onChange={(e) => updateGoal(fi, gi, { assistId: e.target.value })}
                      className="min-w-[120px] flex-1 rounded-lg border border-white/10 bg-astro-surface-2 px-2.5 py-2 text-xs font-bold text-astro-text"
                    >
                      <option value="">No assist</option>
                      {allMembers
                        .filter((p) => p.id !== goal.scorerId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nickname}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      placeholder="Min"
                      value={goal.minute}
                      onChange={(e) => updateGoal(fi, gi, { minute: e.target.value })}
                      className="w-16 rounded-lg border border-white/10 bg-astro-surface-2 px-2 py-2 text-center text-xs font-bold text-astro-text"
                    />
                    <button type="button" onClick={() => removeGoal(fi, gi)} className="text-xs font-bold text-astro-text-dim hover:text-astro-red">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addGoal(fi)}
                className="text-xs font-bold text-astro-accent-soft hover:text-astro-accent"
              >
                + Add goal
              </button>
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
