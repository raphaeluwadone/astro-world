import { supabase } from '@/lib/supabase'

export interface PostRow {
  id: string
  content: string
  created_at: string
  author: { id: string; nickname: string; full_name: string }
  likeCount: number
  likedByMe: boolean
}

export interface MentionedRow {
  player_id: string
  nickname: string
  count: number
}

export interface TagPoolRow {
  id: string
  label: string
}

export async function fetchFeed(currentPlayerId: string | null): Promise<PostRow[]> {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, content, created_at, players!posts_author_id_fkey (id, nickname, full_name)')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  if (!posts || posts.length === 0) return []

  const postIds = posts.map((p) => p.id)
  const { data: likes, error: likesError } = await supabase
    .from('post_likes')
    .select('post_id, player_id')
    .in('post_id', postIds)
  if (likesError) throw likesError

  const likesByPost = new Map<string, string[]>()
  for (const l of likes ?? []) {
    const list = likesByPost.get(l.post_id) ?? []
    list.push(l.player_id)
    likesByPost.set(l.post_id, list)
  }

  return posts.map((p) => {
    const likers = likesByPost.get(p.id) ?? []
    return {
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      author: p.players as unknown as PostRow['author'],
      likeCount: likers.length,
      likedByMe: currentPlayerId ? likers.includes(currentPlayerId) : false,
    }
  })
}

export async function createPost(authorId: string, content: string) {
  const { error } = await supabase.from('posts').insert({ author_id: authorId, content })
  if (error) throw error
}

export async function setLiked(postId: string, playerId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, player_id: playerId })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('player_id', playerId)
    if (error) throw error
  }
}

export async function fetchMostMentioned(): Promise<MentionedRow[]> {
  const { data, error } = await supabase
    .from('post_mentions')
    .select('mentioned_player_id, players (nickname)')
  if (error) throw error

  const counts = new Map<string, { nickname: string; count: number }>()
  for (const row of data ?? []) {
    const nickname = (row.players as unknown as { nickname: string } | null)?.nickname ?? 'Unknown'
    const current = counts.get(row.mentioned_player_id)
    counts.set(row.mentioned_player_id, { nickname, count: (current?.count ?? 0) + 1 })
  }

  return [...counts.entries()]
    .map(([player_id, v]) => ({ player_id, nickname: v.nickname, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
}

export async function fetchTagPool(): Promise<TagPoolRow[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, label')
    .eq('is_approved', true)
    .order('label', { ascending: true })
  if (error) throw error
  return data ?? []
}
