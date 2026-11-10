import { supabase } from '@/lib/supabase'
import { encodeMentions, parseContent, sigil, type Mentionable } from '@/features/community/mentions/tokens'

export const REACTIONS = [
  { key: 'trophy', emoji: '🏆', label: 'Trophy' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'clap', emoji: '👏', label: 'Applause' },
  { key: 'goat', emoji: '🐐', label: 'GOAT' },
  { key: 'laugh', emoji: '😂', label: 'Laughing' },
  { key: 'party', emoji: '🎉', label: 'Party' },
] as const

export type ReactionKey = (typeof REACTIONS)[number]['key']

export interface HonoursPost {
  id: string
  title: string
  content: string
  pinned: boolean
  created_at: string
  author: { id: string; nickname: string } | null
  reactions: { key: ReactionKey; count: number; mine: boolean }[]
}

export async function fetchHonoursPosts(playerId: string | null): Promise<HonoursPost[]> {
  const { data, error } = await supabase
    .from('honours_posts')
    .select('id, title, content, pinned, created_at, players!honours_posts_author_id_fkey (id, nickname)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  const posts = data ?? []
  if (posts.length === 0) return []

  const { data: reacts, error: rError } = await supabase
    .from('honours_reactions')
    .select('post_id, player_id, emoji')
    .in('post_id', posts.map((p) => p.id))
  if (rError) throw rError

  return posts.map(({ players, ...p }) => {
    const mine = (reacts ?? []).filter((r) => r.post_id === p.id)
    return {
      ...p,
      author: players as HonoursPost['author'],
      reactions: REACTIONS.map(({ key }) => {
        const rows = mine.filter((r) => r.emoji === key)
        return { key, count: rows.length, mine: !!playerId && rows.some((r) => r.player_id === playerId) }
      }).filter((r) => r.count > 0),
    }
  })
}

export async function saveHonoursPost(v: { id?: string; authorId: string; title: string; text: string; picked: Mentionable[] }) {
  const { content } = encodeMentions(v.text.trim(), v.picked)
  const row = { title: v.title.trim(), content }
  const { error } = v.id
    ? await supabase.from('honours_posts').update(row).eq('id', v.id)
    : await supabase.from('honours_posts').insert({ ...row, author_id: v.authorId })
  if (error) throw error
}

export async function deleteHonoursPost(id: string) {
  const { error } = await supabase.from('honours_posts').delete().eq('id', id)
  if (error) throw error
}

export async function setHonoursPin(id: string, pinned: boolean) {
  const { error } = await supabase.rpc('set_honours_pin', { p_post_id: id, p_pinned: pinned })
  if (error) throw error
}

export async function setReaction(postId: string, playerId: string, key: ReactionKey, on: boolean) {
  const { error } = on
    ? await supabase.from('honours_reactions').insert({ post_id: postId, player_id: playerId, emoji: key })
    : await supabase.from('honours_reactions').delete().match({ post_id: postId, player_id: playerId, emoji: key })
  if (error) throw error
}

/** Turns stored tokens back into editable text plus the mentions it contains. */
export function decodeForEdit(content: string) {
  const parts = parseContent(content)
  return {
    text: parts.map((p) => (p.type === 'text' ? p.text : `${sigil(p.mention.kind)}${p.mention.label}`)).join(''),
    picked: parts.flatMap((p) => (p.type === 'mention' ? [p.mention] : [])),
  }
}

export interface ClubTotals {
  matchdays: number
  goals: number
  appearances: number
  raised: number
  roster: number
}

export async function fetchClubTotals(): Promise<ClubTotals> {
  const { data, error } = await supabase.rpc('club_totals').single()
  if (error) throw error
  return {
    matchdays: Number(data.matchdays),
    goals: Number(data.goals),
    appearances: Number(data.appearances),
    raised: Number(data.raised),
    roster: data.roster,
  }
}

export type MomentKind = 'matchdays' | 'club-goals' | 'player-apps' | 'player-goals'

export interface ClubMoment {
  kind: MomentKind
  value: number
  player_id: string | null
  happened_at: string
  detail: string | null
}

export async function fetchClubMoments(): Promise<ClubMoment[]> {
  const { data, error } = await supabase.rpc('club_moments')
  if (error) throw error
  return (data ?? []).map((m) => ({ ...m, kind: m.kind as MomentKind, value: Number(m.value) }))
}

/** Cup badges are keyed by cup quarter, so the hall of fame needs each quarter's label and date. */
export async function fetchCupQuarters() {
  const { data, error } = await supabase.from('cup_quarters').select('id, label, scheduled_at')
  if (error) throw error
  return new Map((data ?? []).map((q) => [q.id, q]))
}
