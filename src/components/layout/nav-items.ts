import {
  ArticlesIcon,
  CommunityIcon,
  HomeIcon,
  MatchdayIcon,
  PlayersIcon,
  ProfileIcon,
  RankingsIcon,
} from '@/components/icons/nav-icons'
import type { ComponentType, SVGProps } from 'react'

export interface NavItem {
  label: string
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

/** Desktop sidebar: all 7 sections, in spec order. */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: HomeIcon },
  { label: 'Matchday', to: '/matchday', icon: MatchdayIcon },
  { label: 'Community', to: '/community', icon: CommunityIcon },
  { label: 'Players', to: '/players', icon: PlayersIcon },
  { label: 'Rankings', to: '/rankings', icon: RankingsIcon },
  { label: 'Articles', to: '/articles', icon: ArticlesIcon },
  { label: 'Profile', to: '/profile', icon: ProfileIcon },
]

/**
 * Mobile bottom nav: only 5 of 7, for thumb reach.
 * Players and Articles are reached from cards on Home instead.
 */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: HomeIcon },
  { label: 'Matchday', to: '/matchday', icon: MatchdayIcon },
  { label: 'Community', to: '/community', icon: CommunityIcon },
  { label: 'Rankings', to: '/rankings', icon: RankingsIcon },
  { label: 'Profile', to: '/profile', icon: ProfileIcon },
]
