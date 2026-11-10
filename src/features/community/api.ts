import { supabase } from '@/lib/supabase'
import { MENTIONABLE_BADGES, TIER_LABEL } from '@/features/badges/definitions'
import { encodeMentions, type Mentionable } from './mentions/tokens'

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

const POST_SELECT = 'id, content, created_at, players!posts_author_id_fkey (id, nickname, full_name)'

type RawPost = { id: string; content: string; created_at: string; players: unknown }

async function withLikes(posts: RawPost[], currentPlayerId: string | null): Promise<PostRow[]> {
  if (posts.length === 0) return []
  const { data: likes, error } = await supabase
    .from('post_likes')
    .select('post_id, player_id')
    .in('post_id', posts.map((p) => p.id))
  if (error) throw error

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
      author: p.players as PostRow['author'],
      likeCount: likers.length,
      likedByMe: currentPlayerId ? likers.includes(currentPlayerId) : false,
    }
  })
}

export async function fetchFeed(currentPlayerId: string | null): Promise<PostRow[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return withLikes(data ?? [], currentPlayerId)
}

export async function fetchPost(postId: string, currentPlayerId: string | null): Promise<PostRow | null> {
  const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', postId).maybeSingle()
  if (error) {
    if (error.code === '22P02') return null
    throw error
  }
  if (!data) return null
  const [post] = await withLikes([data], currentPlayerId)
  return post
}

export async function createPost(authorId: string, text: string, picked: Mentionable[]) {
  const { content, mentions } = encodeMentions(text, picked)
  const { data, error } = await supabase.from('posts').insert({ author_id: authorId, content }).select('id').single()
  if (error) throw error
  const playerIds = [...new Set(mentions.filter((m) => m.kind === 'player').map((m) => m.ref))]
  if (playerIds.length > 0) {
    const { error: mentionError } = await supabase
      .from('post_mentions')
      .insert(playerIds.map((id) => ({ post_id: data.id, mentioned_player_id: id })))
    if (mentionError) throw mentionError
  }
}

export async function fetchMentionables(): Promise<Mentionable[]> {
  const [players, tags, awards] = await Promise.all([
    supabase.from('players').select('id, nickname, full_name').order('nickname'),
    supabase.from('tags').select('id, label').eq('is_approved', true).order('label'),
    supabase.from('monthly_awards').select('award_name'),
  ])
  if (players.error) throw players.error
  if (tags.error) throw tags.error
  if (awards.error) throw awards.error
  const badges = new Map<string, string>(MENTIONABLE_BADGES.map((b) => [b.name, `${TIER_LABEL[b.tier]} badge`]))
  for (const a of awards.data ?? []) {
    if (!/^unknown/i.test(a.award_name) && !badges.has(a.award_name)) badges.set(a.award_name, 'Monthly award')
  }
  const achievementNames = [...badges.keys()].sort()
  return [
    ...(players.data ?? []).map((p) => ({ kind: 'player' as const, ref: p.id, label: p.nickname, sub: p.full_name })),
    ...(tags.data ?? []).map((t) => ({ kind: 'tag' as const, ref: t.id, label: t.label })),
    ...achievementNames.map((n) => ({ kind: 'achievement' as const, ref: n, label: n, sub: badges.get(n) })),
  ]
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
