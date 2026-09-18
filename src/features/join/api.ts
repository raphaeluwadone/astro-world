import { supabase } from '@/lib/supabase'

export interface UnclaimedPlayer {
  id: string
  nickname: string
  full_name: string
  joined_at: string
  avg_rating: number | null
  appearances: number
  goals: number
  tags: string[]
}

/** The pre-existing roster: records with no linked account yet. */
export async function fetchUnclaimedPlayers(): Promise<UnclaimedPlayer[]> {
  const [{ data: players, error: playersError }, { data: stats, error: statsError }, { data: tags, error: tagsError }] =
    await Promise.all([
      supabase.from('players').select('id, nickname, full_name, joined_at').is('user_id', null),
      supabase.rpc('player_career_stats'),
      supabase.from('player_tags').select('player_id, tags (label)'),
    ])
  if (playersError) throw playersError
  if (statsError) throw statsError
  if (tagsError) throw tagsError

  const statsByPlayer = new Map((stats ?? []).map((s) => [s.player_id, s]))
  const tagsByPlayer = new Map<string, string[]>()
  for (const row of tags ?? []) {
    const label = (row.tags as unknown as { label: string } | null)?.label
    if (!label) continue
    const list = tagsByPlayer.get(row.player_id) ?? []
    list.push(label)
    tagsByPlayer.set(row.player_id, list)
  }

  return (players ?? []).map((p) => {
    const s = statsByPlayer.get(p.id)
    return {
      ...p,
      avg_rating: s?.avg_rating ?? null,
      appearances: s?.appearances ?? 0,
      goals: s?.goals ?? 0,
      tags: tagsByPlayer.get(p.id) ?? [],
    }
  })
}

export interface JoinDetails {
  instagram_handle: string | null
  birthday_month: number | null
  birthday_day: number | null
}

/** Instagram/birthday ride along on the claim itself rather than being
 * written straight to the target player row: the claimant doesn't own
 * that row yet (user_id is still null until an admin approves), so
 * players_update_own_or_admin would reject a direct write. Approval
 * copies these across. */
export async function submitClaim(playerId: string, claimantUserId: string, details: JoinDetails) {
  const { error } = await supabase
    .from('player_claims')
    .insert({ player_id: playerId, claimant_user_id: claimantUserId, ...details })
  if (error) throw error
}

export async function createNewPlayer(userId: string, nickname: string, fullName: string) {
  const { data, error } = await supabase
    .from('players')
    .insert({ user_id: userId, nickname, full_name: fullName })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export async function updatePlayerJoinDetails(playerId: string, fields: JoinDetails) {
  const { error } = await supabase.from('players').update(fields).eq('id', playerId)
  if (error) throw error
}

export interface MyClaim {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  player_id: string
  players: { nickname: string }
}

/** The signed-in user's most recent claim, if any: used to route a
 * pending/rejected claimant to the right screen instead of `/join` again. */
export async function fetchMyLatestClaim(userId: string): Promise<MyClaim | null> {
  const { data, error } = await supabase
    .from('player_claims')
    .select('id, status, player_id, players!player_claims_player_id_fkey (nickname)')
    .eq('claimant_user_id', userId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as unknown as MyClaim | null
}
