import type { CSSProperties, ReactNode } from 'react'
import { EVEN_ODD, PATHS } from '../BadgeIcon'
import { TIER_COLOR, type BadgeIconName, type BadgeTier } from '../definitions'

const DARK = '#0a0f1f'
const BOUNCE = 'cubic-bezier(.3,1.5,.5,1)'
const OUT = 'ease-out'

function run(name: string, ms: number, origin = '12px 12px', delay = 0, ease = OUT): CSSProperties {
  return { animation: `${name} ${ms}ms ${ease} ${delay}ms both`, transformOrigin: origin }
}

function Icon({ name, style }: { name: BadgeIconName; style?: CSSProperties }) {
  return <path d={PATHS[name]} fill={DARK} fillRule={EVEN_ODD.has(name) ? 'evenodd' : undefined} style={style} />
}

/** `fx` parts only exist for the motion, so they're hidden when motion is reduced. */
function Ball({ cx, cy, style, fx }: { cx: number; cy: number; style: CSSProperties; fx?: boolean }) {
  return (
    <g className={fx ? 'ai-fx' : undefined} style={style}>
      <circle cx={cx} cy={cy} r={2.4} fill="#fff" stroke={DARK} strokeWidth={0.8} />
    </g>
  )
}

function Sparks({ at, delay = 350 }: { at: [number, number][]; delay?: number }) {
  return at.map(([x, y], i) => (
    <circle key={i} className="ai-fx" cx={x} cy={y} r={1.3} fill="#fff" style={run('ai-spark', 700, `${x}px ${y}px`, delay + i * 60)} />
  ))
}

const ART: Record<string, () => ReactNode> = {
  'week-motm': () => (
    <>
      <Icon name="star" style={run('ai-spin-in', 700, undefined, 0, 'cubic-bezier(.2,1.4,.4,1)')} />
      <Sparks at={[[3, 4], [21, 3], [20, 20]]} />
    </>
  ),
  'main-character': () => (
    <>
      <circle className="ai-fx" cx={12} cy={12} r={10} fill="#fff" style={run('ai-spot', 800)} />
      <Icon name="star" style={run('ai-rise', 650, '12px 20px', 150, BOUNCE)} />
    </>
  ),
  'month-player-of-the-month': () => (
    <>
      <rect className="ai-fx" x={-2} y={11} width={14} height={2.4} rx={1.2} fill="#fff" style={run('ai-trail', 700, '12px 12px')} />
      <Icon name="star" style={run('ai-shoot', 700, '12px 12px', 0, 'cubic-bezier(.2,.9,.3,1.2)')} />
    </>
  ),
  'week-clean-sheet': () => (
    <>
      <Icon name="shield" style={run('ai-impact', 900)} />
      <Ball fx cx={3} cy={12} style={run('ai-deflect', 900, undefined, 0, 'ease-in')} />
    </>
  ),
  'ramos-energy': () => (
    <>
      {[4, 8].map((x, i) => (
        <circle key={x} className="ai-fx" cx={x} cy={21} r={1.6} fill="#fff" style={run('ai-dust', 500, `${x}px 21px`, 320 + i * 60)} />
      ))}
      <Icon name="shield" style={run('ai-tackle', 700, '12px 22px', 0, BOUNCE)} />
    </>
  ),
  'cr7-syndrome': () => (
    <>
      <g style={run('ai-ring', 450, undefined, 500)}>
        <Icon name="target" />
      </g>
      <Ball cx={12} cy={12} style={run('ai-bullseye', 550, undefined, 0, 'ease-in')} />
    </>
  ),
  'bag-of-three': () => <Icon name="three" style={run('ai-thump3', 900)} />,
  'mesuts-apprentice': () => <Icon name="assist" style={run('ai-grow', 650, '4px 19px', 0, BOUNCE)} />,
  'month-playmaker': () => <Icon name="assist" style={run('ai-pass', 550, undefined, 0, 'cubic-bezier(.2,1.3,.4,1)')} />,
  centurion: () => <Icon name="hundred" style={run('ai-roll-up', 600, undefined, 0, BOUNCE)} />,
  'month-golden-glove': () => (
    <>
      <Ball fx cx={12.5} cy={6} style={run('ai-drop-in', 900)} />
      <Icon name="glove" style={run('ai-reach', 900, '12px 20px')} />
    </>
  ),
  'clean-freak': () => (
    <>
      <Icon name="glove" style={run('ai-wipe', 900, '12px 20px', 0, 'ease-in-out')} />
      <Sparks at={[[20, 4], [4, 6]]} delay={550} />
    </>
  ),
  'messi-ah': () => <Icon name="crown" style={run('ai-crown', 800, '12px 21px', 0, BOUNCE)} />,
  'sunday-disciple': () => <Icon name="calendar" style={run('ai-page', 600, '12px 4px')} />,
  'new-month-same-me': () => <Icon name="calendar" style={run('ai-page2', 900, '12px 4px')} />,
  'ever-present': () => (
    <>
      <Icon name="calendar" style={run('ai-pulse', 500)} />
      <path
        className="ai-fx"
        d="M8.2 15 10.6 17.4 16.8 11.6"
        fill="none"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={16}
        style={{ animation: 'ai-draw 450ms ease-out 300ms both' }}
      />
    </>
  ),
  'most-capped': () => <Icon name="shirt" style={run('ai-swing-peg', 1000, '12px 3px')} />,
  'early-bird': () => (
    <>
      <circle cx={12} cy={12} r={9.6} fill={DARK} />
      <g style={run('ai-sweep', 800, undefined, 0, 'cubic-bezier(.4,0,.2,1)')}>
        <path d="M12 12V6.5M12 12l3.6 2.2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      </g>
    </>
  ),
  'good-standing': () => <Icon name="coin" style={run('ai-toss', 800, undefined, 0, 'cubic-bezier(.3,.7,.3,1)')} />,
  trending: () => <Icon name="chat" style={run('ai-pop', 600, '4px 20px', 0, 'cubic-bezier(.2,1.6,.4,1)')} />,
  'heart-of-the-team': () => <Icon name="heart" style={run('ai-beat', 900, '12px 13px')} />,
  'card-collector': () => (
    <>
      <path d="M3.3 6.4 11 5l2 12.8-7.7 1.4Z" fill="#ffd23f" stroke={DARK} strokeWidth={1} style={run('ai-fan-l', 600, '8px 19px', 0, BOUNCE)} />
      <path d="M13 4.6l7.7 1.6-2.6 12.6-3.4-.7L13 7Z" fill="#e0483f" stroke={DARK} strokeWidth={1} style={run('ai-fan-r', 600, '16px 19px', 0, BOUNCE)} />
    </>
  ),
  silverware: () => (
    <>
      <Icon name="trophy" style={run('ai-lift', 1000, '12px 21px')} />
      <Sparks at={[[4, 3], [20, 4]]} />
    </>
  ),
  'month-golden-boot': () => (
    <>
      <Icon name="boot" style={run('ai-kick', 700, '5px 18px')} />
      <Ball fx cx={21} cy={16} style={run('ai-fly-off', 700, undefined, 250)} />
    </>
  ),
  'cup-hero': () => (
    <>
      <Icon name="boot" style={run('ai-keepy-boot', 1000, '5px 18px', 0, 'ease-in-out')} />
      <Ball cx={16} cy={11} style={run('ai-keepy-ball', 1000, undefined, 0, 'ease-in-out')} />
    </>
  ),
  'cup-mvp': () => <Icon name="medal" style={run('ai-pendulum', 1100, '12px 1px')} />,
  'iron-curtain': () =>
    ['M3 16h8v4.5H3Zm10 0h8v4.5h-8Z', 'M3 10h4v4.5H3Zm6 0h6v4.5H9Zm8 0h4v4.5h-4Z', 'M3 4h8v4.5H3Zm10 0h8v4.5h-8Z'].map((d, i) => (
      <path key={d} d={d} fill={DARK} style={run('ai-brick', 350, undefined, i * 150, BOUNCE)} />
    )),
  firepower: () => <Icon name="flame" style={run('ai-flare', 900, '12px 20px', 0, 'ease-in-out')} />,
  'back-to-back': () => <Icon name="repeat" style={run('ai-sweep', 800, undefined, 0, 'cubic-bezier(.5,0,.2,1)')} />,
  'wooden-spoon': () => <Icon name="spoon" style={run('ai-stir', 900, '4px 20px', 0, 'ease-in-out')} />,
}

/** Awards not in the list above (custom monthly ones) borrow the art of an award with the same icon. */
const BY_ICON: Record<BadgeIconName, string> = {
  star: 'month-player-of-the-month',
  shield: 'week-clean-sheet',
  target: 'cr7-syndrome',
  three: 'bag-of-three',
  assist: 'month-playmaker',
  hundred: 'centurion',
  glove: 'month-golden-glove',
  crown: 'messi-ah',
  calendar: 'sunday-disciple',
  shirt: 'most-capped',
  clock: 'early-bird',
  coin: 'good-standing',
  chat: 'trending',
  heart: 'heart-of-the-team',
  cards: 'card-collector',
  trophy: 'silverware',
  boot: 'month-golden-boot',
  medal: 'cup-mvp',
  wall: 'iron-curtain',
  flame: 'firepower',
  repeat: 'back-to-back',
  spoon: 'wooden-spoon',
}

/** The award's icon in its tier colour, playing that award's short animation once when it mounts. */
export function AwardIconTile({ awardKey, icon, tier }: { awardKey: string; icon: BadgeIconName; tier: BadgeTier }) {
  const art = ART[awardKey] ?? ART[BY_ICON[icon]]
  const color = TIER_COLOR[tier]
  return (
    <span
      aria-hidden="true"
      className="ai flex size-11 shrink-0 items-center justify-center rounded-[10px] shadow-[inset_-3px_0_0_rgba(255,255,255,0.3)]"
      style={{ background: tier === 'cup' ? 'linear-gradient(170deg,#ffe2a1,#f2a93b 55%,#a8650f)' : color, color }}
    >
      <svg viewBox="0 0 24 24" className="size-[26px] overflow-visible">
        {art()}
      </svg>
    </span>
  )
}
