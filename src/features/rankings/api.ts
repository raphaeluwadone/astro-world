import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PositionType = Database['public']['Enums']['position_type']

export interface RankingRow {
  id: string
  nickname: string
  full_name: string
  positions: PositionType[]
  appearances: number
  goals: number
  assists: number
  motm_count: number
  avg_rating: number | null
}

const MIN_APPEARANCES = 5

export async function fetchRankings(): Promise<RankingRow[]> {
  const [{ data: players, error: playersError }, { data: stats, error: statsError }] = await Promise.all([
    supabase.from('players').select('id, nickname, full_name, positions'),
    supabase.rpc('player_career_stats'),
  ])
  if (playersError) throw playersError
  if (statsError) throw statsError

  const statsByPlayer = new Map((stats ?? []).map((s) => [s.player_id, s]))

  return (players ?? [])
    .map((p) => {
      const s = statsByPlayer.get(p.id)
      return {
        ...p,
        appearances: s?.appearances ?? 0,
        goals: s?.goals ?? 0,
        assists: s?.assists ?? 0,
        motm_count: s?.motm_count ?? 0,
        avg_rating: s?.avg_rating ?? null,
      }
    })
    .filter((r) => r.appearances >= MIN_APPEARANCES)
}
