import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { badgeDef, TIER_RANK, type BadgeDef, type BadgeTier } from './definitions'

export type BadgeStatus = Database['public']['Enums']['badge_status']

export interface BadgeRow {
  id: string
  player_id: string
  badge_key: string
  period_key: string
  title: string | null
  stat: string | null
  detail: string | null
  awarded_at: string
  expires_at: string
  status: BadgeStatus
  auto_live_at: string
  decided_at: string | null
  nickname: string
  photo_url: string | null
}

export interface Badge extends BadgeRow {
  def: BadgeDef
  tier: BadgeTier
  /** When it became visible to everyone. */
  liveFrom: Date
  active: boolean
  /** Share of its lifetime still to run, 0 to 1. */
  remaining: number
  tiedWith: { id: string; nickname: string }[]
}

const DAY_MS = 24 * 60 * 60 * 1000

export async function fetchBadgeRows(): Promise<BadgeRow[]> {
  const { data, error } = await supabase
    .from('player_badges')
    .select('id, player_id, badge_key, period_key, title, stat, detail, awarded_at, expires_at, status, auto_live_at, decided_at, players!player_badges_player_id_fkey (nickname, photo_url)')
    .order('awarded_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(({ players, ...row }) => ({
    ...row,
    nickname: (players as unknown as { nickname: string } | null)?.nickname ?? '',
    photo_url: (players as unknown as { photo_url: string | null } | null)?.photo_url ?? null,
  }))
}

export function isVisible(row: Pick<BadgeRow, 'status' | 'auto_live_at'>, now = Date.now()) {
  return row.status === 'live' || (row.status === 'pending' && new Date(row.auto_live_at).getTime() <= now)
}

/** Visible badges grouped by player, with tie partners and timing worked out. */
export function buildBadges(rows: BadgeRow[], now = Date.now()): Map<string, Badge[]> {
  const visible = rows.filter((r) => isVisible(r, now))
  const byAward = new Map<string, BadgeRow[]>()
  for (const r of visible) {
    const k = `${r.badge_key}|${r.period_key}`
    byAward.set(k, [...(byAward.get(k) ?? []), r])
  }

  const byPlayer = new Map<string, Badge[]>()
  for (const r of visible) {
    const def = badgeDef(r.badge_key, r.title)
    const start = new Date(r.awarded_at).getTime()
    const end = new Date(r.expires_at).getTime()
    const liveFrom = new Date(
      r.status === 'live' && r.decided_at ? r.decided_at : Math.max(start, new Date(r.auto_live_at).getTime()),
    )
    const tiedWith = def.tier === 'week' || def.tier === 'month' || def.tier === 'cup'
      ? []
      : (byAward.get(`${r.badge_key}|${r.period_key}`) ?? [])
          .filter((o) => o.player_id !== r.player_id)
          .map((o) => ({ id: o.player_id, nickname: o.nickname }))
    const badge: Badge = {
      ...r,
      def,
      tier: def.tier,
      liveFrom,
      active: end > now,
      remaining: Math.max(0, Math.min(1, (end - now) / Math.max(DAY_MS, end - start))),
      tiedWith,
    }
    byPlayer.set(r.player_id, [...(byPlayer.get(r.player_id) ?? []), badge])
  }

  for (const list of byPlayer.values()) list.sort(compareBadges)
  return byPlayer
}

export function compareBadges(a: Badge, b: Badge) {
  if (a.active !== b.active) return a.active ? -1 : 1
  return TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.liveFrom.getTime() - a.liveFrom.getTime()
}

/** The badges worth showing beside a name: active, weekly ones left out. */
export function headlineBadges(list: Badge[] | undefined) {
  return (list ?? []).filter((b) => b.active && b.tier !== 'week')
}

export function isNewBadge(b: Badge, now = Date.now()) {
  return b.active && now - b.liveFrom.getTime() < 7 * DAY_MS
}

export async function awardBadges(year?: number) {
  const { data, error } = await supabase.rpc('award_badges', year ? { p_year: year } : {})
  if (error) throw error
  return data
}

export async function decideBadge(id: string, status: BadgeStatus, deciderId: string) {
  const { error } = await supabase
    .from('player_badges')
    .update({ status, decided_by: deciderId, decided_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** `period` is a year, or a cup quarter id for cup badges (those run until the next cup). */
export async function awardManualBadge(playerId: string, badgeKey: string, period: { key: string; at?: string }, deciderId: string, detail?: string) {
  const now = new Date()
  const awarded = period.at ? new Date(period.at) : now
  const expires = new Date(awarded)
  expires.setFullYear(expires.getFullYear() + 1)
  const { error } = await supabase.from('player_badges').insert({
    player_id: playerId,
    badge_key: badgeKey,
    period_key: period.key,
    detail: detail || null,
    awarded_at: awarded.toISOString(),
    expires_at: period.at ? '2999-12-31T00:00:00Z' : expires.toISOString(),
    status: 'live',
    auto_live_at: now.toISOString(),
    decided_by: deciderId,
    decided_at: now.toISOString(),
  })
  if (error) throw error
}

/** Waiting for an admin; once auto_live_at passes they count as live. */
export function pendingBadges(rows: BadgeRow[], now = Date.now()) {
  return rows.filter((r) => r.status === 'pending' && new Date(r.auto_live_at).getTime() > now)
}
