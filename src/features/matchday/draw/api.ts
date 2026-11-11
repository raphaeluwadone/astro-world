import { TEAM_ID as GREEK_TEAMS } from '@/lib/teamId'
import { supabase } from '@/lib/supabase'
import { currentSeasonStart } from '@/lib/season'
import { resultOf } from '@/features/admin/pitch/rotation'
import { computeCupStandings } from '@/features/salami-cup/standings'
import { fetchMatches, fetchPastCups, fetchSquads } from '@/features/salami-cup/api'
import { monthOf } from '../api'
import { pairKey } from './drawTeams'
import { pairSet, planDraw, type DrawContext, type DrawPlan, type DrawPlayer, type DrawRules, type Position, type RatingWindow } from './rules'

/**
 * Who's actually confirmed for this Sunday: this month's monthly
 * members (minus anyone who's opted out of this specific matchday) plus
 * everyone who paid for one of the weekly spots. No lottery involved,
 * both routes in are strictly first-to-pay; the only randomisation is
 * the team split below.
 */
export async function fetchConfirmedPlayerIds(matchdayId: string): Promise<string[]> {
  const { data: matchday, error: matchdayError } = await supabase
    .from('matchdays')
    .select('played_at')
    .eq('id', matchdayId)
    .single()
  if (matchdayError) throw matchdayError

  const month = monthOf(matchday.played_at)

  const [{ data: monthlyMembers, error: monthlyError }, { data: optedOut, error: optedOutError }, { data: weeklyClaims, error: weeklyError }] =
    await Promise.all([
      supabase.from('monthly_memberships').select('player_id').eq('month', month),
      supabase.from('availability').select('player_id').eq('matchday_id', matchdayId).eq('status', 'out'),
      supabase.from('weekly_claims').select('player_id').eq('matchday_id', matchdayId),
    ])
  if (monthlyError) throw monthlyError
  if (optedOutError) throw optedOutError
  if (weeklyError) throw weeklyError

  const optedOutSet = new Set((optedOut ?? []).map((a) => a.player_id))
  const monthlyIds = (monthlyMembers ?? []).map((m) => m.player_id).filter((id) => !optedOutSet.has(id))
  const weeklyIds = (weeklyClaims ?? []).map((w) => w.player_id)

  return [...monthlyIds, ...weeklyIds]
}

/** The last two drawn matchdays before this one, newest first, as their teams' player ids. */
async function fetchRecentTeams(before: string): Promise<{ matchdayId: string; teams: { id: string; players: string[] }[] }[]> {
  const { data, error } = await supabase
    .from('matchdays')
    .select('id, played_at, teams (id, team_members (player_id))')
    .lt('played_at', before)
    .order('played_at', { ascending: false })
    .limit(8)
  if (error) throw error
  return (data ?? [])
    .filter((m) => m.teams.length > 0)
    .slice(0, 2)
    .map((m) => ({ matchdayId: m.id, teams: m.teams.map((t) => ({ id: t.id, players: t.team_members.map((x) => x.player_id) })) }))
}

/** The side that won the most games that day: from Pitch-side if it ran, else the results entered afterwards. */
async function fetchBestTeam(matchdayId: string): Promise<string | null> {
  const wins = new Map<string, number>()
  const won = (id: string) => wins.set(id, (wins.get(id) ?? 0) + 1)
  const { data: games, error } = await supabase.from('pitch_games').select('team_a_id, team_b_id, ended_at, pitch_goals (team_id)').eq('matchday_id', matchdayId)
  if (error) throw error
  const finished = (games ?? []).filter((g) => g.ended_at)
  if (finished.length) {
    for (const g of finished) {
      const r = resultOf({ ...g, goals: g.pitch_goals })
      if ('winner' in r) won(r.winner)
    }
  } else {
    const { data: matches, error: mErr } = await supabase.from('matches').select('team_a_id, team_b_id, score_a, score_b').eq('matchday_id', matchdayId)
    if (mErr) throw mErr
    for (const m of matches ?? []) if (m.score_a !== m.score_b) won(m.score_a > m.score_b ? m.team_a_id : m.team_b_id)
  }
  const [top] = [...wins.entries()].sort((a, b) => b[1] - a[1])
  return top?.[0] ?? null
}

async function fetchCupWinnerIds(): Promise<string[]> {
  const [cup] = await fetchPastCups()
  if (!cup) return []
  const [squads, matches] = await Promise.all([fetchSquads(cup.id), fetchMatches(cup.id)])
  const [top] = computeCupStandings(squads, matches).filter((s) => s.played > 0)
  return squads.find((s) => s.id === top?.squadId)?.members.map((m) => m.id) ?? []
}

function windowBounds(window: RatingWindow, before: Date, lastMatchdayId: string | null): { since: string | null; matchday: string | null } {
  const daysAgo = (n: number) => new Date(before.getTime() - n * 864e5).toISOString()
  switch (window) {
    case 'last_week':
      return { since: null, matchday: lastMatchdayId }
    case 'last_month':
      return { since: daysAgo(31), matchday: null }
    case 'last_3_months':
      return { since: daysAgo(92), matchday: null }
    case 'season':
      return { since: currentSeasonStart().toISOString(), matchday: null }
    case 'all':
      return { since: null, matchday: null }
  }
}

export interface DrawPreview extends DrawPlan {
  /** For the summary: who each rule was about, by id. */
  context: DrawContext
  ratedCount: number
}

/** Works out a split under the given rules without writing anything. Run it again to re-roll. */
export async function previewTeamDraw(matchdayId: string, rules: DrawRules): Promise<DrawPreview> {
  const { data: matchday, error } = await supabase.from('matchdays').select('played_at').eq('id', matchdayId).single()
  if (error) throw error
  const playerIds = await fetchConfirmedPlayerIds(matchdayId)
  if (playerIds.length === 0 || playerIds.length % 6 !== 0) throw new Error(`Expected a multiple of 6 confirmed players, found ${playerIds.length}`)
  const teamCount = playerIds.length / 6
  if (teamCount > GREEK_TEAMS.length) throw new Error(`No team name defined for a ${teamCount}-team draw`)

  const [recent, { data: lastRated, error: lrErr }] = await Promise.all([
    fetchRecentTeams(matchday.played_at),
    supabase.from('matches').select('matchday_id').lt('played_at', matchday.played_at).order('played_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (lrErr) throw lrErr
  const bounds = windowBounds(rules.ratingWindow, new Date(matchday.played_at), lastRated?.matchday_id ?? null)

  const [{ data: players, error: pErr }, { data: stats, error: sErr }, { data: never, error: nErr }, cupWinners, bestTeam] = await Promise.all([
    supabase.from('players').select('id, positions').in('id', playerIds),
    supabase.rpc('draw_player_stats', {
      p_players: playerIds,
      p_since: bounds.since ?? undefined,
      p_matchday: bounds.matchday ?? undefined,
      p_season_start: currentSeasonStart().toISOString(),
    }),
    supabase.from('draw_never_pairs').select('player_a, player_b'),
    rules.splitCupWinners ? fetchCupWinnerIds() : Promise.resolve([]),
    rules.splitLastBest && recent[0] ? fetchBestTeam(recent[0].matchdayId) : Promise.resolve(null),
  ])
  if (pErr) throw pErr
  if (sErr) throw sErr
  if (nErr) throw nErr

  const statOf = new Map((stats ?? []).map((s) => [s.player_id, s]))
  const drawPlayers: DrawPlayer[] = playerIds.map((id) => {
    const p = players?.find((x) => x.id === id)
    const s = statOf.get(id)
    return { id, position: (p?.positions[0] as Position | undefined) ?? null, rating: s && s.rating_count > 0 ? Number(s.avg_rating) : null }
  })

  const [lastWeek, weekBefore] = recent.map((r) => pairSet(r.teams.map((t) => t.players)))
  const twoWeekPairs = new Set([...(lastWeek ?? [])].filter((k) => weekBefore?.has(k)))
  const confirmed = new Set(playerIds)
  const scorers = [...(stats ?? [])].filter((s) => s.season_goals > 0).sort((a, b) => b.season_goals - a.season_goals)

  const context: DrawContext = {
    lastWeekPairs: lastWeek ?? new Set(),
    twoWeekPairs,
    neverPairs: new Set((never ?? []).map((n) => pairKey(n.player_a, n.player_b))),
    cupWinners: new Set(cupWinners.filter((id) => confirmed.has(id))),
    lastBest: new Set(recent[0]?.teams.find((t) => t.id === bestTeam)?.players.filter((id) => confirmed.has(id)) ?? []),
    newcomers: new Set((stats ?? []).filter((s) => s.sundays < 3).map((s) => s.player_id)),
    topScorers: new Set(scorers.slice(0, teamCount).map((s) => s.player_id)),
  }

  return { ...planDraw(drawPlayers, context, rules), context, ratedCount: drawPlayers.filter((p) => p.rating != null).length }
}

/** Writes the previewed sides and marks the matchday drawn, which posts the teams and notifies everyone. */
export async function publishTeamDraw(matchdayId: string, teams: string[][]) {
  const names = GREEK_TEAMS.slice(0, teams.length)
  const { data: inserted, error: teamsError } = await supabase
    .from('teams')
    .insert(names.map((t) => ({ matchday_id: matchdayId, greek_name: t.name, colour: t.colour })))
    .select('id, greek_name')
  if (teamsError) throw teamsError

  const idByName = new Map(inserted.map((t) => [t.greek_name, t.id]))
  const { error: membersError } = await supabase
    .from('team_members')
    .insert(names.flatMap((t, i) => teams[i].map((playerId) => ({ team_id: idByName.get(t.name)!, player_id: playerId }))))
  if (membersError) throw membersError

  const { error: statusError } = await supabase.from('matchdays').update({ status: 'drawn' }).eq('id', matchdayId)
  if (statusError) throw statusError
}
