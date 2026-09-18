import { supabase } from '@/lib/supabase'

/** Total likes across every post this player has written. */
export async function fetchMyCommunityLikes(playerId: string): Promise<number> {
  const { data: myPosts, error: postsError } = await supabase
    .from('posts')
    .select('id')
    .eq('author_id', playerId)
  if (postsError) throw postsError
  const postIds = (myPosts ?? []).map((p) => p.id)
  if (postIds.length === 0) return 0

  const { count, error } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .in('post_id', postIds)
  if (error) throw error
  return count ?? 0
}

export interface PendingRatings {
  pending: number
  total: number
}

/** How many of last week's players this player still hasn't rated. */
export async function fetchPendingRatings(
  playerId: string,
  matchdayId: string,
): Promise<PendingRatings> {
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id')
    .eq('matchday_id', matchdayId)
  if (matchesError) throw matchesError
  const matchIds = (matches ?? []).map((m) => m.id)
  if (matchIds.length === 0) return { pending: 0, total: 0 }

  const [{ data: matchPlayers, error: mpError }, { data: myRatings, error: ratingsError }] = await Promise.all([
    supabase.from('match_players').select('match_id, player_id').in('match_id', matchIds),
    supabase.from('ratings').select('match_id, subject_id').in('match_id', matchIds),
  ])
  if (mpError) throw mpError
  if (ratingsError) throw ratingsError

  const subjects = (matchPlayers ?? []).filter((mp) => mp.player_id !== playerId)
  const rated = new Set((myRatings ?? []).map((r) => `${r.match_id}:${r.subject_id}`))
  const pending = subjects.filter((s) => !rated.has(`${s.match_id}:${s.player_id}`)).length

  return { pending, total: subjects.length }
}
