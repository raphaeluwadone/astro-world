import { AtSign, Award, Camera, ClipboardList, DoorOpen, Hourglass, Shirt, Star, Ticket, TrendingDown, UserCheck, UserX, Wallet, type LucideIcon } from 'lucide-react'
import { BADGE_DEFS, MONTHLY_DEFS, TIER_COLOR } from '@/features/badges/definitions'
import type { NotificationRow } from './api'

export interface FormattedNotification {
  title: string
  body: string
  icon: LucideIcon
  color: string
}

const PURPLE = '#a63fff'
const CYAN = '#38bdf8'
const GREEN = '#4ade80'
const AMBER = '#f2a93b'
const GREY = '#8b93b8'

const EMOJI: Record<string, string> = { trophy: '🏆', fire: '🔥', clap: '👏', goat: '🐐', laugh: '😂', party: '🎉' }

const sunday = (iso: unknown) =>
  typeof iso === 'string' ? new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Sunday'
const shortDate = (iso: unknown) =>
  typeof iso === 'string' ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
const naira = (n: unknown) => `₦${Number(n).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
const names = (list: string[]) => (list.length <= 2 ? list.join(' and ') : `${list[0]}, ${list[1]} and ${list.length - 2} more`)

export function formatNotification(n: NotificationRow): FormattedNotification {
  const d = n.data as Record<string, any>
  const actor = n.actor?.nickname ?? 'An admin'
  const badge = { ...BADGE_DEFS, ...MONTHLY_DEFS }[d.badge_key as string]
  const badgeColor = badge ? (badge.tier === 'cup' ? '#f7c25e' : TIER_COLOR[badge.tier]) : PURPLE
  const quarter = `Q${d.quarter} ${d.year}`

  switch (n.kind) {
    case 'spot':
      return { title: `You're on for ${sunday(d.played_at)}`, body: `Spot ${d.spot} of ${d.capacity}. Teams are drawn Saturday.`, icon: Ticket, color: PURPLE }
    case 'standby':
      return { title: `You're on standby for ${sunday(d.played_at)}`, body: `Number ${d.position} in line. We'll tell you if a spot opens.`, icon: Hourglass, color: PURPLE }
    case 'spot_open':
      return { title: `A spot just opened for ${sunday(d.played_at)}`, body: 'First to claim it gets it.', icon: DoorOpen, color: PURPLE }
    case 'teams_drawn':
      return { title: 'Teams are out', body: `You're on ${d.team} for ${sunday(d.played_at)}.`, icon: Shirt, color: PURPLE }
    case 'rate':
      return { title: 'Rate your teammates', body: `Votes for ${sunday(d.played_at)} are open.`, icon: Star, color: PURPLE }
    case 'badge_won': {
      const shared: string[] = d.shared_with ?? []
      return {
        title: `New badge: ${badge?.name ?? 'Award'}`,
        body: shared.length ? `Shared with ${names(shared)}.` : (d.detail ?? badge?.for ?? ''),
        icon: Award,
        color: badgeColor,
      }
    }
    case 'badge_lost':
      return {
        title: `${badge?.name ?? 'A badge'} has gone`,
        body: d.taken_by ? `${d.taken_by} took it off you.` : "It's moved to your past badges.",
        icon: TrendingDown,
        color: GREY,
      }
    case 'mention':
      return { title: `${actor} mentioned you`, body: d.excerpt ?? '', icon: AtSign, color: CYAN }
    case 'honours_reaction':
      return { title: `${actor} reacted ${EMOJI[d.emoji] ?? ''}`, body: `On “${d.title}”.`, icon: Star, color: CYAN }
    case 'claim_approved':
      return { title: 'Your claim was approved', body: `You're in as ${d.nickname}.`, icon: UserCheck, color: GREEN }
    case 'claim_rejected':
      return { title: "Your claim wasn't approved", body: "Talk to an admin on Sunday if you think that's wrong.", icon: UserX, color: GREY }
    case 'dues_paid':
      return { title: 'Dues received', body: `${d.marked_by ?? 'An admin'} marked your ${quarter} dues as paid.`, icon: Wallet, color: GREEN }
    case 'dues_due':
      return { title: `${quarter} dues are due ${shortDate(d.due_date)}`, body: `${naira(d.amount)}. Pay an admin and they'll mark you as paid.`, icon: Wallet, color: AMBER }
    case 'dues_late':
      return { title: `${quarter} dues are overdue`, body: `${naira(d.amount)}, was due ${shortDate(d.due_date)}.`, icon: Wallet, color: AMBER }
    case 'photo_changed':
      return { title: `${actor} ${d.action} your card photo`, body: 'Admins can update photos that break the rules.', icon: Camera, color: GREY }
    case 'admin_todo': {
      const parts = [
        d.badges ? `${d.badges} badge${d.badges === 1 ? '' : 's'} to confirm` : null,
        d.claims ? `${d.claims} claim${d.claims === 1 ? '' : 's'} to review` : null,
      ].filter(Boolean)
      return {
        title: 'Waiting on admins',
        body: parts.join(', ') + (d.badges && d.next_auto_live ? `. The next badge auto-confirms ${shortDate(d.next_auto_live)}.` : '.'),
        icon: ClipboardList,
        color: AMBER,
      }
    }
    default:
      return { title: 'Notification', body: '', icon: Star, color: PURPLE }
  }
}
