import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Position = Database['public']['Enums']['position_type']
type Foot = Database['public']['Enums']['foot_type']

export interface MemberRow {
  id: string
  nickname: string
  full_name: string
  positions: Position[]
  preferred_foot: Foot | null
  favourite_number: number | null
  instagram_handle: string | null
  birthday_month: number | null
  birthday_day: number | null
  is_admin: boolean
  joined_at: string
  onboarded_at: string | null
  left_at: string | null
  claimed: boolean
  writer: boolean
  appearances: number
  legacy_goals: number
  legacy_assists: number
  legacy_appearances: number
  legacy_clean_sheets: number
  legacy_yellow_cards: number
  legacy_red_cards: number
}

export async function fetchMembers(): Promise<MemberRow[]> {
  const [players, writers, stats] = await Promise.all([
    supabase
      .from('players')
      .select(
        'id, nickname, full_name, positions, preferred_foot, favourite_number, instagram_handle, birthday_month, birthday_day, is_admin, joined_at, onboarded_at, left_at, user_id, legacy_goals, legacy_assists, legacy_appearances, legacy_clean_sheets, legacy_yellow_cards, legacy_red_cards',
      )
      .order('nickname'),
    supabase.from('article_writers').select('player_id'),
    supabase.rpc('player_career_stats'),
  ])
  if (players.error) throw players.error
  if (writers.error) throw writers.error
  if (stats.error) throw stats.error
  const writerIds = new Set((writers.data ?? []).map((w) => w.player_id))
  const apps = new Map((stats.data ?? []).map((s) => [s.player_id, Number(s.appearances ?? 0)]))
  return (players.data ?? []).map(({ user_id, ...p }) => ({ ...p, claimed: !!user_id, writer: writerIds.has(p.id), appearances: apps.get(p.id) ?? 0 }))
}

export type MemberPatch = Partial<
  Pick<
    MemberRow,
    | 'nickname'
    | 'full_name'
    | 'positions'
    | 'preferred_foot'
    | 'favourite_number'
    | 'instagram_handle'
    | 'birthday_month'
    | 'birthday_day'
    | 'legacy_goals'
    | 'legacy_assists'
    | 'legacy_appearances'
    | 'legacy_clean_sheets'
    | 'legacy_yellow_cards'
    | 'legacy_red_cards'
  >
>

export async function updateMember(id: string, patch: MemberPatch) {
  const { error } = await supabase.from('players').update(patch).eq('id', id)
  if (error) throw error
}

export async function setAdmin(id: string, on: boolean) {
  const { error } = await supabase.from('players').update({ is_admin: on }).eq('id', id)
  if (error) throw error
}

export async function setLeft(id: string, left: boolean, by: string) {
  const { error } = await supabase
    .from('players')
    .update(left ? { left_at: new Date().toISOString(), left_by: by } : { left_at: null, left_by: null })
    .eq('id', id)
  if (error) throw error
}

export async function createMember(nickname: string, fullName: string, positions: Position[]): Promise<string> {
  const { data, error } = await supabase
    .from('players')
    .insert({ nickname: nickname.trim(), full_name: fullName.trim(), positions })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}
