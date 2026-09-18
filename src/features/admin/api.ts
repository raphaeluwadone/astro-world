import { supabase } from '@/lib/supabase'

export interface PendingClaimRow {
  id: string
  requested_at: string
  claimant_user_id: string
  instagram_handle: string | null
  birthday_month: number | null
  birthday_day: number | null
  player_id: string
  players: {
    nickname: string
    full_name: string
    joined_at: string
  }
}

export async function fetchPendingClaims(): Promise<PendingClaimRow[]> {
  const { data, error } = await supabase
    .from('player_claims')
    .select(
      'id, requested_at, claimant_user_id, instagram_handle, birthday_month, birthday_day, player_id, players!player_claims_player_id_fkey (nickname, full_name, joined_at)',
    )
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PendingClaimRow[]
}

/** Links the claimed record to the claimant and copies across the
 * instagram/birthday they gave during Join (the claimant couldn't write
 * those directly: they didn't own the row yet). */
export async function approveClaim(claim: PendingClaimRow, reviewerPlayerId: string) {
  const { error: playerError } = await supabase
    .from('players')
    .update({
      user_id: claim.claimant_user_id,
      instagram_handle: claim.instagram_handle,
      birthday_month: claim.birthday_month,
      birthday_day: claim.birthday_day,
    })
    .eq('id', claim.player_id)
  if (playerError) throw playerError

  const { error: statusError } = await supabase
    .from('player_claims')
    .update({ status: 'approved', reviewed_by: reviewerPlayerId, reviewed_at: new Date().toISOString() })
    .eq('id', claim.id)
  if (statusError) throw statusError
}

export async function rejectClaim(claimId: string, reviewerPlayerId: string) {
  const { error } = await supabase
    .from('player_claims')
    .update({ status: 'rejected', reviewed_by: reviewerPlayerId, reviewed_at: new Date().toISOString() })
    .eq('id', claimId)
  if (error) throw error
}
