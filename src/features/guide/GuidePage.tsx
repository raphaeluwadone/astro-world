import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Scene } from '@/components/states/Scene'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { chaptersFor, type ChapterId, type GuideChapter } from './chapters'
import { WeekScene } from './WeekScene'

export function GuidePage({ chapter: requested }: { chapter?: ChapterId }) {
  const { player } = useCurrentPlayer()
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const chapters = chaptersFor(!!player?.is_admin)
  const index = Math.max(0, chapters.findIndex((c) => c.id === requested))
  const current = chapters[index]
  const isFirst = index === 0
  const isLast = index === chapters.length - 1

  function go(i: number) {
    const target = chapters[Math.min(chapters.length - 1, Math.max(0, i))]
    navigate({ to: '/guide', search: { c: target.id }, replace: true })
    const top = cardRef.current?.getBoundingClientRect().top
    if (top !== undefined && top < 0) cardRef.current?.scrollIntoView({ block: 'start' })
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowRight') go(index + 1)
      if (e.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">The guide</div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">HOW ASTRO WORKS</h1>
      <p className="mb-5 max-w-[62ch] text-sm text-astro-text-muted [text-wrap:pretty]">
        The whole week in {chapters.length} short chapters. Come back any time, and for the fine print there are the{' '}
        <Link to="/rules" className="font-bold text-astro-accent-soft underline-offset-4 hover:underline">
          Rules
        </Link>
        .
      </p>

      <nav aria-label="Chapters" className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
        <ol className="flex w-max gap-2 md:w-auto md:flex-wrap">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === index ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-full border py-1.5 pl-1.5 pr-3 text-[12px] font-bold transition-colors',
                  i === index
                    ? 'border-astro-accent/60 bg-astro-accent/15 text-astro-text'
                    : 'border-border bg-astro-surface text-astro-text-muted hover:border-astro-accent/35 hover:text-astro-text',
                  c.adminOnly && i !== index && 'text-astro-cyan',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-[10.5px] font-extrabold',
                    i === index ? 'bg-astro-accent text-astro-on-accent' : i < index ? 'bg-astro-accent/30 text-astro-text' : 'bg-astro-surface-2 text-astro-text-dim',
                  )}
                >
                  {i + 1}
                </span>
                {c.name}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div
        ref={cardRef}
        className={cn(
          'relative scroll-mt-20 overflow-hidden rounded-[18px] border-[1.5px] bg-astro-surface',
          current.adminOnly ? 'border-[rgba(56,189,248,0.45)]' : 'border-[rgba(166,63,255,0.34)]',
        )}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}
      >
        <div className="grid items-stretch md:grid-cols-[1fr_1.15fr]">
          <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden p-6 md:min-h-[420px]" style={{ background: '#0d1428' }}>
            <div className="astro-ghost pointer-events-none absolute -left-1 -top-5 text-[150px]" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div key={current.id} className="relative" style={{ animation: 'gd-scene 520ms cubic-bezier(.2,.8,.2,1) both' }}>
              <ChapterScene chapter={current} />
            </div>
          </div>

          <div key={current.id} className="flex min-w-0 flex-col p-6 md:p-[34px]">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-astro-text-dim" style={rise(0)}>
              Chapter {index + 1} of {chapters.length} · {current.name}
            </div>
            <h2 className="mb-3.5 font-display text-[34px] leading-[0.95] text-astro-text [text-wrap:balance] md:text-[42px]" style={rise(60)}>
              {current.title}
            </h2>
            <p className="mb-5 text-[15px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]" style={rise(120)}>
              {current.body}
            </p>

            <ul className="mb-6 flex flex-col gap-2.5">
              {current.points.map((p, i) => (
                <li key={p} className="flex items-start gap-2.5 rounded-[11px] bg-astro-surface-2 px-[15px] py-3" style={rise(180 + i * 70)}>
                  <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border border-[rgba(166,63,255,0.5)] bg-[rgba(166,63,255,0.2)]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#c589ff" aria-hidden="true">
                      <path d="M9.3 19 2.6 12.3l2.6-2.6 4.1 4.1L18.8 5l2.6 2.6Z" />
                    </svg>
                  </span>
                  <span className="text-[13.5px] leading-[1.5] text-astro-text [text-wrap:pretty]">{p}</span>
                </li>
              ))}
            </ul>

            <Link
              to={current.cta.to}
              className={cn(
                'mb-6 inline-flex w-fit items-center gap-1.5 text-[13px] font-extrabold underline-offset-4 hover:underline',
                current.adminOnly ? 'text-astro-cyan' : 'text-astro-accent-soft',
              )}
            >
              {current.cta.label}
              <span aria-hidden="true">→</span>
            </Link>

            <div className="mt-auto flex items-center gap-2.5">
              <button
                type="button"
                disabled={isFirst}
                onClick={() => go(index - 1)}
                className="rounded-[11px] border border-border bg-astro-surface-2 px-[18px] py-3.5 text-[13px] font-bold text-astro-text-muted disabled:opacity-40"
              >
                Back
              </button>
              {isLast ? (
                <Link
                  to="/matchday"
                  className="rounded-[11px] bg-astro-accent px-6 py-3.5 text-sm font-extrabold text-astro-on-accent no-underline transition-transform hover:-translate-y-0.5"
                >
                  See you Sunday
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  className="rounded-[11px] bg-astro-accent px-6 py-3.5 text-sm font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5"
                >
                  Next<span className="hidden sm:inline">: {chapters[index + 1].name}</span>
                </button>
              )}
              <div className="ml-auto whitespace-nowrap text-[11.5px] text-astro-text-dim">
                {index + 1} / {chapters.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChapterScene({ chapter }: { chapter: GuideChapter }) {
  if (chapter.scene === 'week') return <WeekScene />
  return (
    <div className="origin-center scale-[1.35]">
      <Scene kind={chapter.scene.kind} variant={chapter.scene.variant} />
    </div>
  )
}

const rise = (delay: number) => ({ animation: `gd-in 460ms cubic-bezier(.2,.8,.2,1) ${delay}ms both` })
