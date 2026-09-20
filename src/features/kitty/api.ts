import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type DuesQuarter = Database['public']['Tables']['dues_quarters']['Row']
export type CauseStatus = Database['public']['Enums']['cause_status']
export type Cause = Database['public']['Tables']['causes']['Row']

export interface RosterPlayer {
  id: string
  nickname: string
}

/** Every real player, claimed or not: dues are owed by the whole
 * roster, not just whoever's actually signed up an account so far.
 * fetchActivePlayers (matchday/api.ts) deliberately excludes unclaimed
 * players, which is right for ballot participation but wrong here. */
export async function fetchAllPlayers(): Promise<RosterPlayer[]> {
  const { data, error } = await supabase.from('players').select('id, nickname').order('nickname', { ascending: true })
  if (error) throw error
  return data ?? []
}

export interface DuesPaymentRow {
  player_id: string
  paid_at: string
}

export interface CauseContributor {
  player_id: string
  nickname: string
}

export async function fetchCurrentDuesQuarter(): Promise<DuesQuarter | null> {
  const { data, error } = await supabase
    .from('dues_quarters')
    .select('*')
    .order('year', { ascending: false })
    .order('quarter', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchPastDuesQuarters(): Promise<DuesQuarter[]> {
  const { data, error } = await supabase
    .from('dues_quarters')
    .select('*')
    .order('year', { ascending: false })
    .order('quarter', { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Rows visible under RLS: just the caller's own row (0 or 1) for a
 * regular member, or every row for an admin. One query, two shapes,
 * exactly matching what dues_payments' RLS actually allows through.
 */
export async function fetchDuesPayments(duesQuarterId: string): Promise<DuesPaymentRow[]> {
  const { data, error } = await supabase
    .from('dues_payments')
    .select('player_id, paid_at')
    .eq('dues_quarter_id', duesQuarterId)
  if (error) throw error
  return data ?? []
}

export async function fetchDuesPaidCount(duesQuarterId: string): Promise<number> {
  const { data, error } = await supabase.rpc('dues_paid_count', { p_dues_quarter_id: duesQuarterId })
  if (error) throw error
  return Number(data)
}

export interface NewDuesQuarterFields {
  year: number
  quarter: number
  amount: number
  dueDate: string
}

export async function createDuesQuarter(fields: NewDuesQuarterFields): Promise<string> {
  const { data, error } = await supabase
    .from('dues_quarters')
    .insert({ year: fields.year, quarter: fields.quarter, amount: fields.amount, due_date: fields.dueDate })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function markDuesPaid(duesQuarterId: string, playerId: string, markedBy: string) {
  const { error } = await supabase
    .from('dues_payments')
    .insert({ dues_quarter_id: duesQuarterId, player_id: playerId, marked_by: markedBy })
  if (error) throw error
}

export async function unmarkDuesPaid(duesQuarterId: string, playerId: string) {
  const { error } = await supabase
    .from('dues_payments')
    .delete()
    .eq('dues_quarter_id', duesQuarterId)
    .eq('player_id', playerId)
  if (error) throw error
}

export async function fetchCauses(): Promise<Cause[]> {
  const { data, error } = await supabase.from('causes').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchCauseRaised(causeId: string): Promise<number> {
  const { data, error } = await supabase.rpc('cause_raised_amount', { p_cause_id: causeId })
  if (error) throw error
  return Number(data)
}

export async function fetchCauseContributors(causeId: string): Promise<CauseContributor[]> {
  const { data, error } = await supabase.rpc('cause_contributors', { p_cause_id: causeId })
  if (error) throw error
  return data ?? []
}

export async function suggestCause(title: string, description: string, suggestedBy: string) {
  const { error } = await supabase.from('causes').insert({ title, description, suggested_by: suggestedBy })
  if (error) throw error
}

export async function openCause(causeId: string, targetAmount: number, deadline: string) {
  const { error } = await supabase
    .from('causes')
    .update({ target_amount: targetAmount, deadline, status: 'open' })
    .eq('id', causeId)
  if (error) throw error
}

export async function setCauseStatus(causeId: string, status: CauseStatus) {
  const { error } = await supabase.from('causes').update({ status }).eq('id', causeId)
  if (error) throw error
}

export async function recordContribution(causeId: string, playerId: string, amount: number, markedBy: string) {
  const { error } = await supabase
    .from('cause_contributions')
    .upsert({ cause_id: causeId, player_id: playerId, amount, marked_by: markedBy }, { onConflict: 'cause_id,player_id' })
  if (error) throw error
}
