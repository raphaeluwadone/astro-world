import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BackLink } from '@/components/navigation/BackLink'
import { Timeline, TimelineItem } from '@/components/timeline/Timeline'
import { PageLoader } from '@/components/states/PageLoader'
import { dropDate } from '@/features/honours/feed'
import { useCupQuarters } from '@/features/honours/hooks'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import type { Badge } from './api'
import { AWARD_COPY, pickVariation, type AwardCopy } from './awardCopy'
import { AWARD_IMAGES } from './awardImages'
import { BadgeIcon } from './BadgeIcon'
import { badgeDef, TIER_COLOR, TIER_LABEL, TIER_LASTS, type BadgeDef } from './definitions'
import { BadgeSquare } from './components/BadgePatch'
import { useBadgeRows, useBadgesByPlayer } from './hooks'

const GOLD_TEXT = 'bg-[linear-gradient(180deg,#ffe8b5,#f2a93b)] bg-clip-text text-transparent'

type Quarters = Map<string, { label: string; scheduled_at: string }> | undefined

function periodText(b: Badge, quarters: Quarters) {
  if (/^\d{4}$/.test(b.period_key)) return b.period_key
  if (b.tier === 'cup') return quarters?.get(b.period_key)?.label ?? new Date(b.awarded_at).getFullYear().toString()
  if (b.tier === 'year') return /^\d{4}$/.test(b.period_key) ? b.period_key : new Date(b.awarded_at).getFullYear().toString()
  if (b.tier === 'month') {
    const [y, m] = b.period_key.split('-').map(Number)
    if (y && m) return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }
  return new Date(b.awarded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Write({ copy }: { copy: AwardCopy }) {
  const [index, setIndex] = useState(() => pickVariation(copy.variations.length))
  const [leaving, setLeaving] = useState(false)
  const v = copy.variations[index]

  const another = () => {
    if (leaving) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex((i) => pickVariation(copy.variations.length, i))
      return
    }
    setLeaving(true)
    window.setTimeout(() => {
      setIndex((i) => pickVariation(copy.variations.length, i))
      setLeaving(false)
    }, 200)
  }

  return (
    <section className="astro-card overflow-hidden p-6 md:p-7">
      <div
        key={index}
        style={leaving ? { animation: 'award-take-out 200ms ease-in both' } : undefined}
      >
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim" style={{ animation: 'award-take-in 380ms cubic-bezier(.2,.8,.2,1) both' }}>
            {v.title}
          </div>
          <button
            type="button"
            onClick={another}
            className="rounded-full border border-white/[0.1] px-3 py-1 text-xs font-bold text-astro-text-muted transition-colors hover:border-astro-accent/50 hover:text-astro-text"
          >
            Read another take
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-3 text-[16px] leading-[1.65] text-[#d7dcef] [text-wrap:pretty]">
          {v.paragraphs.map((p, i) => (
            <p
              key={i}
              className={cn(i === v.paragraphs.length - 1 && 'font-display text-[24px] leading-[1.1] text-astro-text')}
              style={{ animation: `award-take-in 460ms cubic-bezier(.2,.8,.2,1) ${80 + i * 70}ms both` }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

// TODO(PHOTOS): no player has a photo yet, so in dev every holder gets this test photo. Add ?nophoto to see the stat card.
const TEST_HOLDER_PHOTO =
  import.meta.env.DEV && !new URLSearchParams(window.location.search).has('nophoto')
    ? {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Amateur_footballer.jpg/960px-Amateur_footballer.jpg',
        credit: 'Test photo: MPF, CC BY-SA 3.0 via Wikimedia Commons.',
      }
    : null

const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * Calls `apply` with scroll progress (0 to 1 over `distance` px, or less on short pages),
 * eased towards the scroll position each frame so the swap glides instead of stepping.
 */
function useSmoothScroll(distance: number, apply: (p: number, raw: number) => void) {
  const applyRef = useRef(apply)
  applyRef.current = apply
  useEffect(() => {
    let frame = 0
    const target = () => {
      const room = document.documentElement.scrollHeight - window.innerHeight
      const d = Math.max(1, Math.min(distance, room * 0.85))
      return Math.min(1, Math.max(0, window.scrollY / d))
    }
    let current = target()
    let last = 0
    applyRef.current(current, current)
    const tick = (now: number) => {
      const t = target()
      const dt = last ? Math.min(100, now - last) : 16
      last = now
      current += (t - current) * (1 - Math.exp(-dt / 110))
      if (Math.abs(t - current) < 0.0015) current = t
      applyRef.current(current, t)
      frame = current === t ? 0 : requestAnimationFrame(tick)
      if (!frame) last = 0
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [distance])
}

function Photo({ awardKey, def, holders, wonOn }: { awardKey: string; def: BadgeDef; holders: Badge[]; wonOn: number | null }) {
  const img = AWARD_IMAGES[awardKey]
  const color = TIER_COLOR[def.tier]
  const accent = def.tier === 'cup' ? '#f7c25e' : color
  const hasHolder = holders.length > 0
  const legend = useRef<HTMLDivElement>(null)
  const legendImg = useRef<HTMLDivElement>(null)
  const holder = useRef<HTMLDivElement>(null)
  const legendCap = useRef<HTMLSpanElement>(null)
  const holderCap = useRef<HTMLSpanElement>(null)

  useSmoothScroll(440, (smooth) => {
    const p = hasHolder ? ease(smooth) : 0
    const set = (el: HTMLElement | null, opacity: number, transform: string) => {
      if (!el) return
      el.style.opacity = String(opacity)
      el.style.transform = transform
      el.style.pointerEvents = opacity < 0.5 ? 'none' : ''
    }
    set(legend.current, 1 - p, `translate3d(0, ${-p * 32}px, 0) scale(${1 + p * 0.07})`)
    if (legendImg.current) legendImg.current.style.transform = `translate3d(0, ${smooth * 42}px, 0) scale(1.1)`
    set(holder.current, p, `translate3d(0, ${(1 - p) * 32}px, 0) scale(${0.96 + p * 0.04})`)
    if (legendCap.current) legendCap.current.style.opacity = String(1 - p)
    if (holderCap.current) holderCap.current.style.opacity = String(p)
  })

  return (
    <figure className="m-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.08] bg-astro-surface-2">
        <div ref={legend} className="absolute inset-0 will-change-[transform,opacity]">
          {img ? (
            <>
              <div ref={legendImg} className="absolute inset-0 will-change-transform">
                <img src={img.src} alt={img.player} className="size-full object-cover object-top" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(transparent,rgba(10,15,31,0.92))]" />
              <div className="absolute bottom-3 left-4 right-4">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: accent }}>
                  The spirit of it
                </div>
                <div className="font-display text-[28px] leading-none text-white">{img.player}</div>
              </div>
            </>
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{ background: `radial-gradient(circle at 50% 35%, color-mix(in srgb, ${color} 35%, transparent), #0f1730 70%)`, color }}
            >
              <BadgeIcon name={def.icon} className="size-24 opacity-80" />
            </div>
          )}
        </div>

        {hasHolder && (
          <div ref={holder} className="absolute inset-0 opacity-0 will-change-[transform,opacity]">
            <HolderVisual holders={holders} color={color} accent={accent} wonOn={wonOn} />
          </div>
        )}
      </div>
      <figcaption className="relative mt-2 min-h-[44px] text-[11px] leading-snug text-astro-text-dim">
        {img && (
          <span ref={legendCap} className="absolute inset-0">
            Photo: {img.credit},{' '}
            <a href={img.source} target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-astro-text">
              {img.license} via Wikimedia Commons
            </a>
            . Shown for illustration; {img.player} has no connection to this award or to Astro.
          </span>
        )}
        {hasHolder && (
          <span ref={holderCap} className="absolute inset-0 opacity-0">
            {holders.length > 1 ? `Held jointly by ${holders.length} players right now.` : `Held by ${holders[0].nickname} right now.`}
            {TEST_HOLDER_PHOTO && ` ${TEST_HOLDER_PHOTO.credit}`}
          </span>
        )}
      </figcaption>
    </figure>
  )
}

function holderPhoto(b: Badge) {
  return b.photo_url ?? TEST_HOLDER_PHOTO?.src ?? null
}

function HolderVisual({ holders, color, accent, wonOn }: { holders: Badge[]; color: string; accent: string; wonOn: number | null }) {
  const eyebrow = (
    <div className="text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: accent }}>
      {holders.length > 1 ? 'Current holders' : 'Current holder'}
    </div>
  )

  if (holders.length === 1) {
    const b = holders[0]
    const photo = holderPhoto(b)
    if (photo) {
      return (
        <Link to="/players/$playerId" params={{ playerId: b.player_id }} className="group absolute inset-0 block">
          <img src={photo} alt={b.nickname} className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(transparent,rgba(10,15,31,0.94))]" />
          <div className="absolute bottom-3 left-4 right-4">
            {eyebrow}
            <div className="font-display text-[30px] leading-none text-white group-hover:underline">{b.nickname}</div>
            {b.stat && <div className="mt-1 text-xs text-white/70">{b.stat}</div>}
          </div>
        </Link>
      )
    }
    return (
      <Link
        to="/players/$playerId"
        params={{ playerId: b.player_id }}
        className="group flex size-full flex-col justify-between p-5 no-underline"
        style={{ background: `radial-gradient(130% 90% at 50% 0%, color-mix(in srgb, ${color} 34%, transparent), #0f1730 72%)` }}
      >
        {eyebrow}
        <div className="flex flex-col items-center text-center">
          <span
            className="flex size-24 items-center justify-center rounded-full font-display text-[40px] transition-transform group-hover:scale-105"
            style={{ background: color, color: '#0a0f1f', boxShadow: `0 0 0 6px color-mix(in srgb, ${color} 22%, transparent)` }}
          >
            {initials(b.nickname)}
          </span>
          <div className="mt-4 font-display text-[36px] leading-none text-white group-hover:underline">{b.nickname}</div>
          {b.stat && <div className="mt-2 font-display text-[22px] leading-none" style={{ color: accent }}>{b.stat}</div>}
        </div>
        <div className="border-t border-white/10 pt-3 text-xs text-astro-text-muted">
          {b.detail ?? b.def.for}
          {wonOn ? ` · Won ${longDate(wonOn)}` : ''}
        </div>
      </Link>
    )
  }

  const shown = holders.slice(0, 4)
  const extra = holders.length - shown.length
  return (
    <div
      className="flex size-full flex-col gap-3 p-4"
      style={{ background: `radial-gradient(130% 90% at 50% 0%, color-mix(in srgb, ${color} 28%, transparent), #0f1730 72%)` }}
    >
      {eyebrow}
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2">
        {shown.map((b) => {
          const photo = holderPhoto(b)
          return (
            <Link
              key={b.id}
              to="/players/$playerId"
              params={{ playerId: b.player_id }}
              className="group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-astro-bg/50 p-2 text-center no-underline transition-colors hover:border-white/25"
            >
              {photo ? (
                <>
                  <img src={photo} alt={b.nickname} className="absolute inset-0 size-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(transparent,rgba(10,15,31,0.92))]" />
                  <span className="relative mt-auto truncate text-sm font-extrabold text-white">{b.nickname}</span>
                </>
              ) : (
                <>
                  <span className="flex size-11 items-center justify-center rounded-full font-display text-[18px]" style={{ background: color, color: '#0a0f1f' }}>
                    {initials(b.nickname)}
                  </span>
                  <span className="mt-2 w-full truncate text-sm font-extrabold text-astro-text group-hover:underline">{b.nickname}</span>
                  {b.stat && <span className="w-full truncate text-[11px] text-astro-text-muted">{b.stat}</span>}
                </>
              )}
            </Link>
          )
        })}
      </div>
      {extra > 0 && <div className="text-center text-xs font-bold text-astro-text-muted">and {extra} more</div>}
    </div>
  )
}

interface Season {
  key: string
  label: string
  badges: Badge[]
  active: boolean
  at: number
  wonOn: number
  until: number
}

const longDate = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace('Sept', 'Sep')

export function AwardPage({ awardKey }: { awardKey: string }) {
  const { data: rows = [], isLoading } = useBadgeRows()
  const byPlayer = useBadgesByPlayer()
  const { data: quarters } = useCupQuarters()

  const all = useMemo(() => [...byPlayer.values()].flat().filter((b) => b.badge_key === awardKey), [byPlayer, awardKey])
  const title = all[0]?.title ?? rows.find((r) => r.badge_key === awardKey)?.title ?? null
  const def = badgeDef(awardKey, title)
  const copy = AWARD_COPY[awardKey]
  const color = TIER_COLOR[def.tier]
  const isCup = def.tier === 'cup'

  const seasons = useMemo(() => {
    const map = new Map<string, Season>()
    for (const b of all) {
      const s = map.get(b.period_key) ?? {
        key: b.period_key,
        label: periodText(b, quarters),
        badges: [],
        active: false,
        at: 0,
        wonOn: 0,
        until: 0,
      }
      s.badges.push(b)
      s.active ||= b.active
      s.at = Math.max(s.at, new Date(b.awarded_at).getTime())
      s.until = Math.max(s.until, new Date(b.expires_at).getTime())
      map.set(b.period_key, s)
    }
    for (const s of map.values()) s.wonOn = dropDate(s.badges, quarters).getTime()
    return [...map.values()].sort((a, b) => b.wonOn - a.wonOn)
  }, [all, quarters])

  if (isLoading) return <PageLoader />

  const current = seasons.filter((s) => s.active)
  const past = seasons.filter((s) => !s.active)

  return (
    <div className="flex flex-col gap-6">
      <BackLink to="/awards" label="All awards" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <header>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em]" style={{ color: isCup ? '#f7c25e' : color }}>
              <span className="size-2 rounded-[2px]" style={{ background: isCup ? 'linear-gradient(#ffe2a1,#f2a93b)' : color }} />
              {TIER_LABEL[def.tier]} award · {TIER_LASTS[def.tier]}
            </div>
            <h1 className={cn('font-display text-[52px] leading-[0.92] md:text-[72px]', isCup ? GOLD_TEXT : 'text-astro-text')}>{def.name}</h1>
            <p className="mt-2 text-[15px] font-bold text-astro-text-muted">{copy?.recognition ?? def.for}</p>
            {copy && <p className="mt-1 max-w-[62ch] text-sm text-astro-text-dim">{copy.personality}</p>}
          </header>

          {copy ? (
            <Write key={awardKey} copy={copy} />
          ) : (
            <section className="astro-card p-6">
              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">What it&rsquo;s for</div>
              <p className="text-[16px] leading-[1.6] text-[#d7dcef]">{def.for}</p>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-[30px] leading-none text-astro-text">
              {current.reduce((n, s) => n + s.badges.length, 0) > 1 ? 'Current holders' : 'Current holder'}
            </h2>
            {current.length === 0 ? (
              <p className="text-sm text-astro-text-dim">Nobody holds this one right now.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {current.map((s) => (
                  <HoldersPanel key={s.key} season={s} color={isCup ? '#f2a93b' : color} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-[30px] leading-none text-astro-text">Past winners</h2>
            {past.length === 0 ? (
              <p className="text-sm text-astro-text-dim">No past winners yet. This is where the history starts.</p>
            ) : (
              <Timeline>
                {past.map((s) => (
                  <TimelineItem
                    key={s.key}
                    color={isCup ? '#f2a93b' : color}
                    eyebrow={`Won ${longDate(s.wonOn)} · held until ${longDate(s.until)}`}
                    title={s.label}
                  >
                    <WinnerList season={s} />
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </section>
        </div>

        <aside className="order-first lg:order-none">
          {/* Pinned to the viewport on desktop. The offsets match AppShell's main padding and the header above. */}
          <div className="max-w-[340px] lg:fixed lg:right-[42px] lg:top-[145px] lg:w-[300px] xl:w-[340px]">
            <Photo awardKey={awardKey} def={def} holders={current.flatMap((c) => c.badges)} wonOn={current[0]?.wonOn ?? null} />
          </div>
        </aside>
      </div>
    </div>
  )
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function HoldersPanel({ season, color }: { season: Season; color: string }) {
  const joint = season.badges.length > 1
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
        background: `radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, ${color} 16%, transparent), transparent 60%), var(--color-astro-surface, #121a33)`,
      }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-display text-[26px] leading-none text-astro-text">{season.label}</span>
        <span className="text-xs text-astro-text-dim">Won {longDate(season.wonOn)}</span>
        {joint && (
          <span
            className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
          >
            Shared by {season.badges.length}
          </span>
        )}
      </div>

      {joint ? (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))' }}>
          {season.badges.map((b) => (
            <Link
              key={b.id}
              to="/players/$playerId"
              params={{ playerId: b.player_id }}
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-astro-bg/40 px-3 py-2.5 no-underline transition-colors hover:border-white/20"
            >
              <PlayerPhoto
                playerId={b.player_id}
                alt=""
                className="flex size-9 items-center justify-center rounded-full font-display text-[15px]"
                style={{ background: color, color: '#0a0f1f' }}
                fallback={initials(b.nickname)}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-astro-text">{b.nickname}</span>
                {b.stat && <span className="block truncate text-xs text-astro-text-muted">{b.stat}</span>}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        season.badges.map((b) => (
          <Link key={b.id} to="/players/$playerId" params={{ playerId: b.player_id }} className="flex items-center gap-4 no-underline">
            <PlayerPhoto
              playerId={b.player_id}
              alt=""
              className="flex size-14 items-center justify-center rounded-full font-display text-[22px]"
              style={{ background: color, color: '#0a0f1f', boxShadow: `0 0 0 4px color-mix(in srgb, ${color} 22%, transparent)` }}
              fallback={initials(b.nickname)}
            />
            <span>
              <span className="block font-display text-[34px] leading-none text-astro-text hover:underline">{b.nickname}</span>
              {b.stat && <span className="mt-1 block text-sm text-astro-text-muted">{b.stat}</span>}
            </span>
          </Link>
        ))
      )}

      {season.badges[0]?.detail && <p className="mt-4 text-xs text-astro-text-dim">{season.badges[0].detail}</p>}
    </div>
  )
}

function WinnerList({ season }: { season: Season }) {
  return (
    <div className="flex flex-col gap-2">
      {season.badges.map((b) => (
        <div key={b.id} className="flex items-center gap-2.5">
          <BadgeSquare badge={b} size={24} />
          <Link to="/players/$playerId" params={{ playerId: b.player_id }} className="font-extrabold text-astro-text hover:underline">
            {b.nickname}
          </Link>
          {b.stat && <span className="text-[13px] text-astro-text-muted">{b.stat}</span>}
        </div>
      ))}
      {season.badges[0]?.detail && <div className="text-xs text-astro-text-dim">{season.badges[0].detail}</div>}
    </div>
  )
}
