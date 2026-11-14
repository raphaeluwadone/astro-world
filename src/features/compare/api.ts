import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PositionType = Database['public']['Enums']['position_type']

export type CompareScope = 'season' | 'career' | 'cup'

export interface CompareRow {
  id: string
  nickname: string
  full_name: string
  positions: PositionType[]
  apps: number
  /** Own goals already taken off. */
  goals: number
  ownGoals: number
  assists: number
  cleanSheets: number
  rating: number | null
  motm: number
  cupsPlayed: number
  cupsWon: number
  cupGames: number
  cupWins: number
  cupGoals: number
  cupOwnGoals: number
  cupCleanSheets: number
  cupHeroes: number
}

export interface CompareData {
  rows: CompareRow[]
  /** Sundays played this season, or Salami Cups played for the cup scope. */
  played: number
}

export function seasonStart(now = new Date()) {
  const year = Number(now.toLocaleString('en-GB', { year: 'numeric', timeZone: 'Europe/London' }))
  // Midnight 1 Jan, London time. In January London is on GMT, so this is exact.
  return { year, iso: new Date(Date.UTC(year, 0, 1)).toISOString() }
}

export async function fetchCompare(scope: CompareScope): Promise<CompareData> {
  const { iso } = seasonStart()
  const [players, stats, played] = await Promise.all([
    supabase.from('players').select('id, nickname, full_name, positions').is('left_at', null),
    supabase.rpc('compare_stats', scope === 'season' ? { p_since: iso } : {}),
    scope === 'cup'
      ? supabase.from('cup_quarters').select('id', { count: 'exact', head: true }).eq('status', 'played')
      : supabase
          .from('matchdays')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'played')
          .gte('played_at', scope === 'season' ? iso : '1970-01-01'),
  ])
  if (players.error) throw players.error
  if (stats.error) throw stats.error
  if (played.error) throw played.error

  const byId = new Map((stats.data ?? []).map((s) => [s.player_id, s]))
  const rows = (players.data ?? []).map((p) => {
    const s = byId.get(p.id)
    return {
      ...p,
      apps: s?.appearances ?? 0,
      goals: s?.goals ?? 0,
      ownGoals: s?.own_goals ?? 0,
      assists: s?.assists ?? 0,
      cleanSheets: s?.clean_sheets ?? 0,
      rating: s?.avg_rating ?? null,
      motm: s?.motm ?? 0,
      cupsPlayed: s?.cups_played ?? 0,
      cupsWon: s?.cups_won ?? 0,
      cupGames: s?.cup_games ?? 0,
      cupWins: s?.cup_wins ?? 0,
      cupGoals: s?.cup_goals ?? 0,
      cupOwnGoals: s?.cup_own_goals ?? 0,
      cupCleanSheets: s?.cup_clean_sheets ?? 0,
      cupHeroes: s?.cup_heroes ?? 0,
    }
  })
  rows.sort((a, b) => a.nickname.localeCompare(b.nickname))
  return { rows, played: played.count ?? 0 }
}
