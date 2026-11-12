import { supabase } from '@/lib/supabase'

/** Total likes across every post this player has written. */
/** Likes minus dislikes across everything this player has posted. */
/** Likes minus dislikes on your posts, plus a heart for each time someone else uses or votes on a trait you invented. */
export async function fetchMyCommunityLikes(playerId: string): Promise<number> {
  const [{ data: myPosts, error: postsError }, traits] = await Promise.all([
    supabase.from('posts').select('id').eq('author_id', playerId),
    supabase.rpc('trait_hearts', { p_player: playerId }),
  ])
  if (postsError) throw postsError
  if (traits.error) throw traits.error
  const traitHearts = traits.data ?? 0
  const postIds = (myPosts ?? []).map((p) => p.id)
  if (postIds.length === 0) return traitHearts

  const count = (table: 'post_likes' | 'post_dislikes') =>
    supabase.from(table).select('*', { count: 'exact', head: true }).in('post_id', postIds)
  const [likes, dislikes] = await Promise.all([count('post_likes'), count('post_dislikes')])
  if (likes.error) throw likes.error
  if (dislikes.error) throw dislikes.error
  return (likes.count ?? 0) - (dislikes.count ?? 0) + traitHearts
}

export interface AwardRaceRow {
  badge_key: string
  scope: 'month' | 'year'
  mine: number | null
  my_rank: number | null
  leader: number | null
  leaders: string[]
  contenders: number
}

/** Where the signed-in player stands in this month's and this year's award races. */
export async function fetchAwardRace(): Promise<AwardRaceRow[]> {
  const { data, error } = await supabase.rpc('award_race')
  if (error) throw error
  return (data ?? []) as AwardRaceRow[]
}
