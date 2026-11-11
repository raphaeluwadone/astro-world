export type AdminSectionId =
  | 'matchday'
  | 'results'
  | 'cup'
  | 'pitch'
  | 'draw'
  | 'kit'
  | 'dues'
  | 'causes'
  | 'articles'
  | 'members'
  | 'badges'
  | 'punish'
  | 'rules'
  | 'audit'

export interface AdminNavItem {
  id: AdminSectionId
  label: string
  /** Absent for sections designed but not built yet: shown in the rail, not clickable. */
  to?: string
  /** Single-path 24×24 icon, lifted from Astro-Admin.dc.html. */
  icon: string
  iconEvenOdd?: boolean
}

export interface AdminNavGroup {
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Run the week',
    items: [
      {
        id: 'matchday',
        label: 'Matchday control',
        to: '/admin/matchday',
        icon: 'M2.4 4h19.2v16H2.4ZM4.6 6.2v11.6H11V6.2ZM13 6.2v11.6h6.4V6.2Z',
        iconEvenOdd: true,
      },
      {
        id: 'results',
        label: 'Results',
        to: '/admin/results',
        icon: 'M3 3.2h18v17.6H3Zm2.2 2.2v13.2h13.6V5.4Zm2 2.4h9.6v2H7.2Zm0 3.8h9.6v2H7.2Zm0 3.8h5.6v2H7.2Z',
        iconEvenOdd: true,
      },
      {
        id: 'cup',
        label: 'Salami Cup',
        to: '/admin/cup',
        icon: 'M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z',
      },
      {
        id: 'pitch',
        label: 'Pitch-side',
        to: '/admin/pitch',
        icon: 'M9.2 1.6h5.6v2.5H9.2ZM12 4.9a8.7 8.7 0 1 0 0 17.4 8.7 8.7 0 0 0 0-17.4Zm1.2 3.5v5h3.9v2.3h-6.2V8.4Z',
        iconEvenOdd: true,
      },
      {
        id: 'draw',
        label: 'Draw rules',
        to: '/admin/draw',
        icon: 'M3 5.8h4.6l8.2 10.2h2.4v-2.6L22 17.1l-3.8 3.7v-2.6h-3.4L6.6 8H3Zm15.2-3.9L22 5.6l-3.8 3.7V6.7h-2.4l-2.3 2.9-1.4-1.8 2.7-3.3h3.4ZM3 15.8h3.6l2.2-2.7 1.4 1.8L7.7 18H3Z',
      },
      {
        id: 'kit',
        label: 'Kit',
        icon: 'M9.4 2.6h5.2v2.2h4.8v16.6H4.6V4.8h4.8ZM6.8 7v11.2h10.4V7Zm2.4 2.2h5.6v2.1H9.2Z',
        iconEvenOdd: true,
      },
    ],
  },
  {
    label: 'Money',
    items: [
      {
        id: 'dues',
        label: 'Dues',
        to: '/admin/dues',
        icon: 'M2.6 6.4h18.8v11.2H2.6Zm2.2 2.2v6.8h14.4V8.6Zm7.2 0.9a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
        iconEvenOdd: true,
      },
      {
        id: 'causes',
        label: 'Causes',
        to: '/admin/causes',
        icon: 'M12 21.2 3.8 13a5.1 5.1 0 0 1 7.2-7.2l1 1 1-1A5.1 5.1 0 0 1 20.2 13Z',
      },
    ],
  },
  {
    label: 'Publish',
    items: [
      {
        id: 'articles',
        label: 'Articles',
        to: '/admin/articles',
        icon: 'M3.2 3.4h13.2l4.4 4.4v12.8H3.2Zm2.4 2.4v12.4h12.8V9.2h-3.6V5.8Zm1.8 4.2h5.4v1.9H7.4Zm0 3.6h9.2v1.9H7.4Z',
        iconEvenOdd: true,
      },
    ],
  },
  {
    label: 'Govern',
    items: [
      {
        id: 'members',
        label: 'Members',
        to: '/admin/members',
        icon: 'M12 3.2a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4ZM4.2 20.8c1-3.9 4-6 7.8-6s6.8 2.1 7.8 6Z',
      },
      {
        id: 'badges',
        label: 'Badges',
        to: '/admin/badges',
        icon: 'M12 2.2 19.4 6v6.2c0 4.6-3.1 8-7.4 9.6-4.3-1.6-7.4-5-7.4-9.6V6Zm0 4.6-1.4 2.9-3.1.4 2.3 2.2-.6 3.1 2.8-1.5 2.8 1.5-.6-3.1 2.3-2.2-3.1-.4Z',
        iconEvenOdd: true,
      },
      {
        id: 'punish',
        label: 'Punishments',
        icon: 'M4.6 3.4h14.8v4.2H4.6ZM6.8 9.6h10.4V20.6H6.8Zm2.6 3.2v4.8h5.2v-4.8Z',
      },
      {
        id: 'rules',
        label: 'Rules',
        icon: 'M12 2.2 3.4 5.5v6.4c0 5 3.6 8.3 8.6 10.1 5-1.8 8.6-5.1 8.6-10.1V5.5ZM10.8 16.4 6.8 12.3l1.9-1.9 2.1 2.1 4.4-4.4 1.9 1.9Z',
        iconEvenOdd: true,
      },
      {
        id: 'audit',
        label: 'Audit log',
        icon: 'M4 2.8h12.4L20 6.4V21.2H4ZM7 8.2h10v2H7ZM7 12.2h10v2H7ZM7 16.2h6.4v2H7Z',
        iconEvenOdd: true,
      },
    ],
  },
]
