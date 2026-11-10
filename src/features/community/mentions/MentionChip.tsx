import { cn } from 'cn'
import { CupHoverCard, MemorialHoverCard, PlayerHoverCard, TagHoverCard } from '@/components/hover/InfoCards'
import { BadgeHoverCard } from '@/features/badges/components/BadgeHoverCard'
import { BadgeMark } from '@/features/badges/components/BadgeMark'
import { BADGE_DEFS, MENTIONABLE_BADGES, MONTHLY_DEFS, TIER_COLOR, type BadgeTier } from '@/features/badges/definitions'
import { parseContent, type MentionKind, type Mentionable } from './tokens'

const KIND_TEXT: Record<Exclude<MentionKind, 'achievement'>, string> = {
  player: 'text-astro-accent-soft',
  tag: 'text-[#c3cbe6] underline decoration-white/25 decoration-dotted underline-offset-[3px]',
  memorial: 'text-[#e8ecfa]',
  cup: 'text-[#f7c25e]',
}

const TIER_TEXT: Record<BadgeTier, string> = {
  week: 'text-astro-green',
  month: 'text-astro-cyan',
  year: 'text-[#b980ff]',
  cup: 'text-[#f7c25e]',
}

const AWARD_KEY_BY_NAME = new Map(Object.entries({ ...BADGE_DEFS, ...MONTHLY_DEFS }).map(([key, d]) => [d.name, key]))

/** Monthly award names aren't in the badge list, so anything unknown counts as monthly. */
export function achievementTier(label: string): BadgeTier {
  return MENTIONABLE_BADGES.find((b) => b.name === label)?.tier ?? 'month'
}

/** Text colour for a mention, shared by the chips and the composer highlight. Badges follow their tier. */
export function mentionText(m: Pick<Mentionable, 'kind' | 'label'>) {
  return m.kind === 'achievement' ? TIER_TEXT[achievementTier(m.label)] : KIND_TEXT[m.kind]
}

export function tierSwatch(label: string) {
  const c = TIER_COLOR[achievementTier(label)]
  return { background: `color-mix(in srgb, ${c} 14%, transparent)`, color: c }
}

const GOLD_TEXT = 'bg-[linear-gradient(180deg,#ffe2a1,#f2a93b_55%,#c97d16)] bg-clip-text text-transparent'

const BASE = 'inline-flex items-baseline gap-1 rounded-md px-1.5 py-px align-baseline font-bold no-underline'
const PLAIN = 'font-bold no-underline'

const TROPHY = 'M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z'
const STAR = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z'

export function KindGlyph({ kind, className }: { kind: MentionKind; className?: string }) {
  if (kind === 'memorial')
    return (
      <span
        aria-hidden="true"
        className={cn('font-display inline-flex size-[15px] items-center justify-center self-center rounded-[4px] border border-[#cbd5f5]/50 text-[10px] leading-none text-[#e8ecfa]', className)}
        style={{ clipPath: 'polygon(0 0,100% 0,100% 72%,72% 100%,0 100%)' }}
      >
        13
      </span>
    )
  if (kind === 'cup' || kind === 'achievement')
    return (
      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill={kind === 'cup' ? '#f2a93b' : 'currentColor'} className={cn('self-center', className)}>
        <path d={kind === 'cup' ? TROPHY : STAR} />
      </svg>
    )
  if (kind === 'tag') return <span aria-hidden="true" className={cn('opacity-70', className)}>#</span>
  return <span aria-hidden="true" className={cn('opacity-70', className)}>@</span>
}

export function MentionChip({ mention }: { mention: Mentionable }) {
  switch (mention.kind) {
    case 'player':
      return (
        <span className="inline-flex items-baseline gap-1">
          <PlayerHoverCard playerId={mention.ref} name={mention.label} className={cn(PLAIN, KIND_TEXT.player, 'hover:underline')}>
            @{mention.label}
          </PlayerHoverCard>
          <BadgeMark playerId={mention.ref} size={13} showExtra={false} />
        </span>
      )
    case 'memorial':
      return (
        <MemorialHoverCard>
          <span
            className={cn(
              BASE,
              KIND_TEXT.memorial,
              'items-center border border-[#cbd5f5]/30 bg-[linear-gradient(120deg,rgba(203,213,245,0.14),rgba(203,213,245,0.03))] pl-1 font-display text-[1.06em] font-normal tracking-[0.02em] hover:border-[#cbd5f5]/55',
            )}
          >
            <KindGlyph kind="memorial" />
            {mention.label}
          </span>
        </MemorialHoverCard>
      )
    case 'cup':
      return (
        <CupHoverCard>
          <span
            className={cn(
              BASE,
              'items-center border border-astro-amber/55 bg-[linear-gradient(120deg,rgba(242,169,59,0.24),rgba(242,169,59,0.05))] font-display text-[1.06em] font-normal tracking-[0.02em] shadow-[0_0_14px_rgba(242,169,59,0.22)] hover:border-astro-amber',
            )}
          >
            <KindGlyph kind="cup" />
            <span className={GOLD_TEXT}>{mention.label}</span>
          </span>
        </CupHoverCard>
      )
    case 'achievement': {
      const key = AWARD_KEY_BY_NAME.get(mention.label)
      const text = <span className={cn(PLAIN, mentionText(mention))}>@{mention.label}</span>
      if (!key) return text
      return (
        <BadgeHoverCard awardKey={key} triggerClassName="inline cursor-pointer rounded hover:underline">
          {text}
        </BadgeHoverCard>
      )
    }
    case 'tag':
      return (
        <TagHoverCard label={mention.label}>
          <span className={cn(PLAIN, KIND_TEXT.tag, 'hover:text-astro-text')}>#{mention.label}</span>
        </TagHoverCard>
      )
  }
}

export function PostContent({ content }: { content: string }) {
  return (
    <>
      {parseContent(content).map((part, i) =>
        part.type === 'text' ? <span key={i}>{part.text}</span> : <MentionChip key={i} mention={part.mention} />,
      )}
    </>
  )
}
