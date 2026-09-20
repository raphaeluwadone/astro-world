import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type EditablePlayerFields = Partial<
  Pick<
    Database['public']['Tables']['players']['Row'],
    | 'nickname'
    | 'full_name'
    | 'positions'
    | 'preferred_foot'
    | 'height_cm'
    | 'weight_kg'
    | 'favourite_number'
    | 'favourite_club'
    | 'favourite_club_logo_url'
    | 'bio'
  >
>

export interface ClubRow {
  id: string
  name: string
  country: string | null
  logo_url: string | null
}

export async function updatePlayer(playerId: string, fields: EditablePlayerFields) {
  const { error } = await supabase.from('players').update(fields).eq('id', playerId)
  if (error) throw error
}

// Goes through an Edge Function for the same reason pro-players-search
// does: the API-Football key can't live in the browser, and this is
// also what caches real hits into pro_clubs.
export async function searchClubs(query: string): Promise<ClubRow[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const { data, error } = await supabase.functions.invoke<{ results: ClubRow[] }>('pro-clubs-search', {
    body: { query: trimmed },
  })
  if (error) throw error
  return data?.results ?? []
}

export async function addSelfTag(playerId: string, tagId: string) {
  const { error } = await supabase
    .from('player_tags')
    .insert({ player_id: playerId, tag_id: tagId, source: 'self' })
  if (error) throw error
}

export async function removeSelfTag(playerTagRowId: string) {
  const { error } = await supabase.from('player_tags').delete().eq('id', playerTagRowId)
  if (error) throw error
}
