import type { SVGProps } from 'react'
import type { BadgeIconName } from './definitions'

export const PATHS: Record<BadgeIconName, string> = {
  trophy: 'M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z',
  target: 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm0 3.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  assist: 'M3 17.5 13.5 7H9V4.5h9v9h-2.5V8.9L5 19.4Zm14 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  hundred: 'M2 7h3v10H3V9.3l-1 .5ZM7 7h6v10H7Zm2 2v6h2V9Zm6-2h6v10h-6Zm2 2v6h2V9Z',
  glove: 'M7 21v-6.5L4.6 10a1.6 1.6 0 0 1 2.7-1.7L9 10.6V4.5a1.5 1.5 0 0 1 3 0V10V3.5a1.5 1.5 0 0 1 3 0V10V5a1.5 1.5 0 0 1 3 0v8.5c0 4-2.5 7.5-6 7.5Z',
  shield: 'M12 2 20 5v6c0 5-3.4 9.2-8 11-4.6-1.8-8-6-8-11V5Z',
  crown: 'M3 7.5 8 11l4-6.5 4 6.5 5-3.5-1.8 10.5H4.8ZM5 19.5h14V21H5Z',
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z',
  calendar: 'M7 2h2v2h6V2h2v2h2.5A1.5 1.5 0 0 1 21 5.5v14a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-14A1.5 1.5 0 0 1 4.5 4H7Zm-2 7v10h14V9Zm11.2 2.3 1.4 1.4-6.1 6.1-3.6-3.6 1.4-1.4 2.2 2.2Z',
  shirt: 'M8.5 3 12 5l3.5-2L21 6l-2 4.5-2-1V21H7V9.5l-2 1L3 6Z',
  clock: 'M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2Zm1 4.4v5.8l4 2.4-1 1.7-5-3V6.8Z',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm1 4v1.1c1.3.3 2.3 1.2 2.4 2.4h-2c-.1-.4-.6-.7-1.4-.7-.9 0-1.4.4-1.4.8 0 .5.5.7 1.8 1 1.9.4 3.1 1.1 3.1 2.8 0 1.3-1 2.3-2.5 2.5V18h-2v-1.1c-1.5-.3-2.5-1.3-2.6-2.6h2c.1.6.7.9 1.6.9 1 0 1.5-.4 1.5-.9 0-.5-.4-.8-1.8-1.1-1.8-.4-3-1.1-3-2.7 0-1.2.9-2.2 2.3-2.5V7Z',
  chat: 'M4 4h16v12H9l-5 4Zm4 5v2h2V9Zm4 0v2h2V9Z',
  heart: 'M12 21.4S3.6 16.2 3.6 10.5A4.7 4.7 0 0 1 12 7.2a4.7 4.7 0 0 1 8.4 3.3c0 5.7-8.4 10.9-8.4 10.9Z',
  cards: 'M3.3 6.4 11 5l2 12.8-7.7 1.4ZM13 4.6l7.7 1.6-2.6 12.6-3.4-.7L13 7Z',
  boot: 'M4 6h6l1 5 5 2c3 1 5 2.5 5 5v1H3V7Z',
  three: 'M3 4h18v16H3Zm6 3H7v2h2v1H7v2h2v1H7v2h2a2 2 0 0 0 2-2v-1a1.5 1.5 0 0 0-.5-1 1.5 1.5 0 0 0 .5-1V9a2 2 0 0 0-2-2Zm4 0v10h2V7Zm4 0v10h2V7Z',
  wall: 'M3 4h8v4.5H3Zm10 0h8v4.5h-8ZM3 10h4v4.5H3Zm6 0h6v4.5H9Zm8 0h4v4.5h-4ZM3 16h8v4.5H3Zm10 0h8v4.5h-8Z',
  flame: 'M12 2c1 3.5 5.5 6 5.5 11.5a5.5 5.5 0 0 1-11 0c0-2.6 1.3-4.5 2.7-5.8.2 1.8 1 3 2.2 3.6C10.9 8.6 10.8 5.2 12 2Z',
  repeat: 'M17 2.5 21 6.5l-4 4V8H7.5A2.5 2.5 0 0 0 5 10.5V12H3v-1.5A4.5 4.5 0 0 1 7.5 6H17ZM7 21.5 3 17.5l4-4V16h9.5a2.5 2.5 0 0 0 2.5-2.5V12h2v1.5a4.5 4.5 0 0 1-4.5 4.5H7Z',
  spoon: 'M16.2 2.2c2.6.2 4.3 2.4 3.6 5.1-.6 2.4-2.9 4.1-5.1 4l-8.3 8.6a1.9 1.9 0 0 1-2.7-2.7l8.5-8.2c-.1-2.5 1.6-6.9 4-6.8Z',
  medal: 'M6.5 2h4.2L12 5.6 13.3 2h4.2l-3.2 7.4a6 6 0 1 1-4.6 0ZM12 11.2a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8Z',
}

export const EVEN_ODD = new Set<BadgeIconName>(['medal', 'target', 'calendar', 'clock', 'coin', 'chat', 'hundred', 'three'])

export function BadgeIcon({ name, ...props }: { name: BadgeIconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d={PATHS[name]} fillRule={EVEN_ODD.has(name) ? 'evenodd' : undefined} />
    </svg>
  )
}
