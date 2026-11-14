import { supabase } from '@/lib/supabase'
import { DEFAULT_RULES, type DrawRules } from './rules'

export async function fetchDrawRules(): Promise<DrawRules> {
  const { data, error } = await supabase.from('draw_settings').select('rules').maybeSingle()
  if (error) throw error
  return { ...DEFAULT_RULES, ...((data?.rules ?? {}) as Partial<DrawRules>) }
}

export async function saveDrawRules(rules: DrawRules, by: string | undefined) {
  const { error } = await supabase.from('draw_settings').update({ rules: { ...rules }, updated_at: new Date().toISOString(), updated_by: by ?? null }).eq('id', true)
  if (error) throw error
}

export interface NeverPair {
  player_a: string
  player_b: string
}

export async function fetchNeverPairs(): Promise<NeverPair[]> {
  const { data, error } = await supabase.from('draw_never_pairs').select('player_a, player_b').order('created_at')
  if (error) throw error
  return data ?? []
}

export async function addNeverPair(a: string, b: string, by: string | undefined) {
  const [player_a, player_b] = a < b ? [a, b] : [b, a]
  const { error } = await supabase.from('draw_never_pairs').insert({ player_a, player_b, created_by: by ?? null })
  if (error) throw error
}

export async function removeNeverPair(pair: NeverPair) {
  const { error } = await supabase.from('draw_never_pairs').delete().eq('player_a', pair.player_a).eq('player_b', pair.player_b)
  if (error) throw error
}
