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
    | 'bio'
  >
>

export async function updatePlayer(playerId: string, fields: EditablePlayerFields) {
  const { error } = await supabase.from('players').update(fields).eq('id', playerId)
  if (error) throw error
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
