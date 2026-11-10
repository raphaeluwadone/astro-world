import { useNextMatchday } from '@/features/matchday/hooks'
import { useAllPlayers, useCurrentDuesQuarter, useDuesPaidCount } from '@/features/kitty/hooks'
import { useCurrentCup } from '@/features/salami-cup/hooks'
import { usePendingClaims } from '../hooks'
import { pendingBadges } from '@/features/badges/api'
import { useBadgeRows } from '@/features/badges/hooks'
import type { AdminSectionId } from './adminNav'

/** Red: overdue and blocking others. Amber: yours, nobody waiting. Cyan: a list to work through. */
export type AttentionTone = 'red' | 'amber' | 'cyan'

export interface AttentionItem {
  section: AdminSectionId
  tone: AttentionTone
  badge: string
  line: string
}

/**
 * The single source for rail badges and the "Needs you" card, so a badge
 * can never appear without its line or the other way round.
 */
export function useAdminAttention(): AttentionItem[] {
  const { data: matchday } = useNextMatchday()
  const { data: claims = [] } = usePendingClaims()
  const { data: cup } = useCurrentCup()
  const { data: duesQuarter } = useCurrentDuesQuarter()
  const { data: paidCount = 0 } = useDuesPaidCount(duesQuarter?.id)
  const { data: players = [] } = useAllPlayers()
  const { data: badgeRows = [] } = useBadgeRows()

  const items: AttentionItem[] = []

  if (matchday && matchday.status === 'drawn' && new Date(matchday.played_at) < new Date()) {
    items.push({ section: 'results', tone: 'red', badge: '1', line: "Sunday's result isn't in" })
  }

  if (cup?.status === 'live') {
    items.push({ section: 'cup', tone: 'amber', badge: 'Live', line: 'Salami Cup is live' })
  }

  if (claims.length > 0) {
    items.push({
      section: 'members',
      tone: 'cyan',
      badge: String(claims.length),
      line: `${claims.length} record ${claims.length === 1 ? 'claim' : 'claims'} waiting`,
    })
  }

  const waiting = new Set(pendingBadges(badgeRows).map((r) => `${r.badge_key}|${r.period_key}`)).size
  if (waiting > 0) {
    items.push({
      section: 'badges',
      tone: 'cyan',
      badge: String(waiting),
      line: `${waiting} ${waiting === 1 ? 'badge' : 'badges'} to confirm`,
    })
  }

  const unpaid = duesQuarter ? Math.max(0, players.length - paidCount) : 0
  if (duesQuarter && unpaid > 0) {
    items.push({
      section: 'dues',
      tone: 'cyan',
      badge: String(unpaid),
      line: `${unpaid} haven't paid Q${duesQuarter.quarter}`,
    })
  }

  const order: Record<AttentionTone, number> = { red: 0, amber: 1, cyan: 2 }
  return items.sort((a, b) => order[a.tone] - order[b.tone])
}
