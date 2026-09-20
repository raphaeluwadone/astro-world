import {
  ArticlesIcon,
  CommunityIcon,
  HomeIcon,
  KittyIcon,
  MatchdayIcon,
  PlayersIcon,
  PredictionsIcon,
  ProfileIcon,
  RankingsIcon,
  RulesIcon,
  SalamiCupIcon,
} from '@/components/icons/nav-icons'
import type { ComponentType, SVGProps } from 'react'

export interface NavItem {
  label: string
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Section is real in the design but has no route yet: shown, not clickable. */
  disabled?: boolean
}

/**
 * Desktop sidebar, full spec order (Astro App.dc.html's SECTIONS list).
 * One section has no feature behind it yet (Predictions, kept last per
 * Raphael): shown disabled rather than omitted, same treatment the
 * Admin portal link had before claims existed, so the real shape of
 * the app is visible and each lights up as it ships.
 */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: HomeIcon },
  { label: 'Matchday', to: '/matchday', icon: MatchdayIcon },
  { label: 'Salami Cup', to: '/salami-cup', icon: SalamiCupIcon },
  { label: 'Community', to: '/community', icon: CommunityIcon },
  { label: 'Players', to: '/players', icon: PlayersIcon },
  { label: 'Rankings', to: '/rankings', icon: RankingsIcon },
  { label: 'Predictions', to: '/predictions', icon: PredictionsIcon, disabled: true },
  { label: 'Articles', to: '/articles', icon: ArticlesIcon },
  { label: 'Kitty', to: '/kitty', icon: KittyIcon },
  { label: 'Rules', to: '/rules', icon: RulesIcon },
  { label: 'Profile', to: '/profile', icon: ProfileIcon },
]

/**
 * Mobile bottom nav: only 5, for thumb reach. Disabled sections don't
 * belong here at all, not even greyed out, there's no room.
 */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: HomeIcon },
  { label: 'Matchday', to: '/matchday', icon: MatchdayIcon },
  { label: 'Community', to: '/community', icon: CommunityIcon },
  { label: 'Rankings', to: '/rankings', icon: RankingsIcon },
  { label: 'Profile', to: '/profile', icon: ProfileIcon },
]
