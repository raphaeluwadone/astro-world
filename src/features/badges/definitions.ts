export type BadgeTier = 'week' | 'month' | 'year' | 'cup'

export type BadgeIconName =
  | 'trophy'
  | 'target'
  | 'assist'
  | 'hundred'
  | 'glove'
  | 'shield'
  | 'crown'
  | 'star'
  | 'calendar'
  | 'shirt'
  | 'clock'
  | 'coin'
  | 'chat'
  | 'heart'
  | 'cards'
  | 'boot'
  | 'three'
  | 'wall'
  | 'flame'
  | 'repeat'
  | 'spoon'
  | 'medal'

export interface BadgeDef {
  name: string
  tier: BadgeTier
  icon: BadgeIconName
  /** What the badge is for, shown in the hover card. */
  for: string
  /** Given out by an admin rather than worked out from results. */
  manual?: boolean
}

export const TIER_LABEL: Record<BadgeTier, string> = {
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
  cup: 'Salami Cup',
}

export const TIER_LASTS: Record<BadgeTier, string> = {
  week: 'Until the next matchday',
  month: 'Through the following month',
  year: '12 months, renewed if won again',
  cup: 'Until the next cup',
}

export const TIER_COLOR: Record<BadgeTier, string> = {
  week: '#4ade80',
  month: '#38bdf8',
  year: '#a63fff',
  cup: '#f2a93b',
}

export const TIER_RANK: Record<BadgeTier, number> = { cup: 0, year: 1, month: 2, week: 3 }

export const BADGE_DEFS: Record<string, BadgeDef> = {
  'week-motm': { name: 'Man of the Match', tier: 'week', icon: 'star', for: 'Voted best player on the day' },
  'week-clean-sheet': { name: 'Clean Sheet', tier: 'week', icon: 'shield', for: 'Kept a clean sheet' },

  'cr7-syndrome': { name: 'CR7 Syndrome', tier: 'year', icon: 'target', for: 'Top scorer of the year' },
  'bag-of-three': { name: 'Bag of Three', tier: 'year', icon: 'three', for: 'Scored a hat-trick in one match' },
  'mesuts-apprentice': { name: "Özil's Apprentice", tier: 'year', icon: 'assist', for: 'Most assists of the year' },
  centurion: { name: 'Centurion', tier: 'year', icon: 'hundred', for: 'Passed 100 career goals' },
  'clean-freak': { name: 'Clean Freak', tier: 'year', icon: 'glove', for: 'Most clean sheets of the year' },
  'ramos-energy': { name: 'The Ramos Protocol', tier: 'year', icon: 'shield', for: 'Best-rated defender or keeper of the year' },
  'messi-ah': { name: 'La Pulga Supreme', tier: 'year', icon: 'crown', for: 'Best average rating of the year' },
  'main-character': { name: 'Main Character', tier: 'year', icon: 'star', for: 'Most Man of the Match wins' },
  'new-month-same-me': { name: 'New month, same me', tier: 'year', icon: 'calendar', for: 'Won the same monthly award two months running' },
  'sunday-disciple': { name: 'Sunday Disciple', tier: 'year', icon: 'calendar', for: 'Played every matchday of the year' },
  'most-capped': { name: 'Most Capped', tier: 'year', icon: 'shirt', for: 'Most appearances of the year' },
  'early-bird': { name: 'Early Bird', tier: 'year', icon: 'clock', for: 'First to claim a weekly spot most often' },
  'good-standing': { name: 'Good Standing', tier: 'year', icon: 'coin', for: 'Paid every quarter on time' },
  trending: { name: 'Trending', tier: 'year', icon: 'chat', for: 'Most tagged in the group chat' },
  'heart-of-the-team': { name: 'Heart of the Team', tier: 'year', icon: 'heart', for: 'Chosen by the admins for team spirit', manual: true },
  'card-collector': { name: 'Card Collector', tier: 'year', icon: 'cards', for: 'Most cards of the year' },
  'fair-play': { name: 'Fair Play', tier: 'year', icon: 'heart', for: 'Most appearances of the year without a card' },

  silverware: { name: 'Silverware', tier: 'cup', icon: 'trophy', for: 'Won the Salami Cup' },
  // TODO(DATA): cup matches don't record scorers yet.
  'cup-hero': { name: 'Cup Hero', tier: 'cup', icon: 'boot', for: 'Top scorer across the Salami Cup', manual: true },
  'cup-mvp': { name: 'Cup MVP', tier: 'cup', icon: 'medal', for: 'Chosen by the admins as the best player of the Salami Cup', manual: true },
  'iron-curtain': { name: 'Iron Curtain', tier: 'cup', icon: 'wall', for: 'In the squad that conceded the fewest at the Salami Cup' },
  firepower: { name: 'Firepower', tier: 'cup', icon: 'flame', for: 'In the squad that scored the most at the Salami Cup' },
  'back-to-back': { name: 'Back to Back', tier: 'cup', icon: 'repeat', for: 'Won the Salami Cup two times in a row, or more' },
  'ever-present': { name: 'Ever-present', tier: 'cup', icon: 'calendar', for: 'Played in every Salami Cup of the year' },
  'wooden-spoon': { name: 'Wooden Spoon', tier: 'cup', icon: 'spoon', for: 'In the squad that finished bottom of the Salami Cup', manual: true },
}

export const MONTHLY_DEFS: Record<string, BadgeDef> = {
  'month-player-of-the-month': { name: 'Player of the Month', tier: 'month', icon: 'star', for: 'Best average rating of the month' },
  'month-golden-boot': { name: 'Golden Boot', tier: 'month', icon: 'boot', for: 'Most goals of the month' },
  'month-playmaker': { name: 'Playmaker', tier: 'month', icon: 'assist', for: 'Most assists of the month' },
  'month-golden-glove': { name: 'Golden Glove', tier: 'month', icon: 'glove', for: 'Most clean sheets of the month' },
  'month-most-booked': { name: 'Most Booked', tier: 'month', icon: 'cards', for: 'Most cards of the month' },
}

export function badgeDef(key: string, title: string | null): BadgeDef {
  const known = BADGE_DEFS[key]
  if (known) return known
  if (MONTHLY_DEFS[key]) return MONTHLY_DEFS[key]
  if (key.startsWith('month-')) {
    const slug = key.slice('month-'.length)
    return { name: title ?? slug, tier: 'month', icon: 'star', for: `Monthly award: ${title ?? slug}` }
  }
  return { name: title ?? key, tier: 'year', icon: 'star', for: '' }
}

export const MANUAL_BADGES = Object.entries(BADGE_DEFS)
  .filter(([, d]) => d.manual)
  .map(([key, d]) => ({ key, ...d }))

/** Badge names people can @-mention, with the tier that colours them. */
export const MENTIONABLE_BADGES = Object.values(BADGE_DEFS)
  .filter((d) => d.tier !== 'week')
  .map((d) => ({ name: d.name, tier: d.tier }))
