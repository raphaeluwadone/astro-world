import { supabase } from '@/lib/supabase'
import { MENTIONABLE_BADGES, TIER_LABEL } from '@/features/badges/definitions'
import { mentionsIn } from '@/components/editor/markdown'
import type { Mentionable } from './mentions/tokens'

export interface PostRow {
  id: string
  content: string
  created_at: string
  author: { id: string; nickname: string; full_name: string }
  kind: 'teams' | 'report' | null
  likeCount: number
  likedByMe: boolean
  dislikeCount: number
  dislikedByMe: boolean
  replyCount: number
}

export interface ReplyRow {
  id: string
  post_id: string
  content: string
  created_at: string
  author: { id: string; nickname: string }
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

const POST_SELECT = 'id, content, created_at, kind, players!posts_author_id_fkey (id, nickname, full_name)'

type RawPost = { id: string; content: string; created_at: string; kind: string | null; players: unknown }

function groupBy(rows: { post_id: string; player_id?: string }[]) {
  const map = new Map<string, string[]>()
  for (const r of rows) map.set(r.post_id, [...(map.get(r.post_id) ?? []), r.player_id ?? ''])
  return map
}

async function withLikes(posts: RawPost[], currentPlayerId: string | null): Promise<PostRow[]> {
  if (posts.length === 0) return []
  const ids = posts.map((p) => p.id)
  const [likes, dislikes, replies] = await Promise.all([
    supabase.from('post_likes').select('post_id, player_id').in('post_id', ids),
    supabase.from('post_dislikes').select('post_id, player_id').in('post_id', ids),
    supabase.from('post_replies').select('post_id').in('post_id', ids),
  ])
  if (likes.error) throw likes.error
  if (dislikes.error) throw dislikes.error
  if (replies.error) throw replies.error
  const likesByPost = groupBy(likes.data ?? [])
  const dislikesByPost = groupBy(dislikes.data ?? [])
  const repliesByPost = groupBy(replies.data ?? [])

  return posts.map((p) => {
    const likers = likesByPost.get(p.id) ?? []
    const dislikers = dislikesByPost.get(p.id) ?? []
    return {
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      author: p.players as PostRow['author'],
      kind: p.kind as PostRow['kind'],
      likeCount: likers.length,
      likedByMe: currentPlayerId ? likers.includes(currentPlayerId) : false,
      dislikeCount: dislikers.length,
      dislikedByMe: currentPlayerId ? dislikers.includes(currentPlayerId) : false,
      replyCount: repliesByPost.get(p.id)?.length ?? 0,
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

export async function createPost(authorId: string, content: string) {
  const mentions = mentionsIn(content)
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
    supabase.from('players').select('id, nickname, full_name').is('left_at', null).order('nickname'),
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

export async function setDisliked(postId: string, playerId: string, disliked: boolean) {
  const { error } = disliked
    ? await supabase.from('post_dislikes').insert({ post_id: postId, player_id: playerId })
    : await supabase.from('post_dislikes').delete().eq('post_id', postId).eq('player_id', playerId)
  if (error) throw error
}

export async function fetchReplies(postId: string): Promise<ReplyRow[]> {
  const { data, error } = await supabase
    .from('post_replies')
    .select('id, post_id, content, created_at, author:players!post_replies_author_id_fkey (id, nickname)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as ReplyRow[]
}

export async function createReply(postId: string, authorId: string, content: string) {
  const { error } = await supabase.from('post_replies').insert({ post_id: postId, author_id: authorId, content: content.trim() })
  if (error) throw error
}

export async function deleteReply(replyId: string) {
  const { error } = await supabase.from('post_replies').delete().eq('id', replyId)
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

export interface PendingTrait {
  id: string
  label: string
  votes: number
  votedByMe: boolean
  mine: boolean
}

export async function fetchPendingTraits(viewerId: string | null): Promise<PendingTrait[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, label, created_by, tag_creation_votes (voter_id)')
    .eq('is_approved', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((t) => {
    const voters = (t.tag_creation_votes ?? []).map((v) => v.voter_id)
    return { id: t.id, label: t.label, votes: voters.length, votedByMe: !!viewerId && voters.includes(viewerId), mine: t.created_by === viewerId }
  })
}

export async function inventTrait(label: string, createdBy: string) {
  const { error } = await supabase.from('tags').insert({ label: label.trim(), created_by: createdBy })
  if (error) throw error
}

export async function setTraitVote(tagId: string, voterId: string, on: boolean) {
  const { error } = on
    ? await supabase.from('tag_creation_votes').insert({ tag_id: tagId, voter_id: voterId })
    : await supabase.from('tag_creation_votes').delete().eq('tag_id', tagId).eq('voter_id', voterId)
  if (error) throw error
}

export interface PlayerTraitVotes {
  tagId: string
  votes: number
  votedByMe: boolean
}

export async function fetchPlayerTraitVotes(playerId: string, viewerId: string | null): Promise<PlayerTraitVotes[]> {
  const { data, error } = await supabase.from('player_tag_votes').select('tag_id, voter_id').eq('player_id', playerId)
  if (error) throw error
  const byTag = new Map<string, PlayerTraitVotes>()
  for (const v of data ?? []) {
    const row = byTag.get(v.tag_id) ?? { tagId: v.tag_id, votes: 0, votedByMe: false }
    row.votes += 1
    if (v.voter_id === viewerId) row.votedByMe = true
    byTag.set(v.tag_id, row)
  }
  return [...byTag.values()]
}

export async function setPlayerTraitVote(playerId: string, tagId: string, voterId: string, on: boolean) {
  const { error } = on
    ? await supabase.from('player_tag_votes').insert({ player_id: playerId, tag_id: tagId, voter_id: voterId })
    : await supabase.from('player_tag_votes').delete().eq('player_id', playerId).eq('tag_id', tagId).eq('voter_id', voterId)
  if (error) throw error
}
