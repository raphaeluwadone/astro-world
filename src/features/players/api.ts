import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PositionType = Database['public']['Enums']['position_type']

export interface PlayerCardRow {
  id: string
  nickname: string
  full_name: string
  positions: PositionType[]
  favourite_number: number | null
  avg_rating: number | null
  tags: string[]
}

export async function fetchPlayerCards(): Promise<PlayerCardRow[]> {
  const [{ data: players, error: playersError }, { data: stats, error: statsError }, { data: tags, error: tagsError }] =
    await Promise.all([
      supabase
        .from('players')
        .select('id, nickname, full_name, positions, favourite_number')
        .order('nickname', { ascending: true }),
      supabase.rpc('player_career_stats'),
      supabase.from('player_tags').select('player_id, tags (label)'),
    ])
  if (playersError) throw playersError
  if (statsError) throw statsError
  if (tagsError) throw tagsError

  const ratingByPlayer = new Map((stats ?? []).map((s) => [s.player_id, s.avg_rating]))
  const tagsByPlayer = new Map<string, string[]>()
  for (const row of tags ?? []) {
    const label = (row.tags as unknown as { label: string } | null)?.label
    if (!label) continue
    const list = tagsByPlayer.get(row.player_id) ?? []
    list.push(label)
    tagsByPlayer.set(row.player_id, list)
  }

  return (players ?? []).map((p) => ({
    ...p,
    avg_rating: ratingByPlayer.get(p.id) ?? null,
    tags: (tagsByPlayer.get(p.id) ?? []).slice(0, 2),
  }))
}
