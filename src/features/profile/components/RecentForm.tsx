import { NothingHere } from '@/components/states/NothingHere'
import { Scene } from '@/components/states/Scene'
import { cn } from 'cn'
import type { ReactNode } from 'react'
import type { MatchRatingRow } from '../api'

function tileColors(rating: number) {
  if (rating >= 8)
    return {
      background: 'rgba(166,63,255,0.18)',
      color: '#c589ff',
      border: 'rgba(166,63,255,0.5)',
    }
  if (rating >= 6.5)
    return {
      background: '#182448',
      color: '#eef0f9',
      border: 'rgba(255,255,255,0.07)',
    }
  return {
    background: 'rgba(224,72,63,0.13)',
    color: '#e0483f',
    border: 'rgba(224,72,63,0.5)',
  }
}

export function RecentForm({
  matchRatings,
  title = 'Recent Form',
  titleSize = 30,
  summary,
  compact = false,
  showStats = false,
}: {
  matchRatings: MatchRatingRow[]
  title?: string
  titleSize?: 26 | 30
  summary?: ReactNode
  /** Smaller tiles for the home preview card. */
  compact?: boolean
  /** Averages beside the tiles, for the full-width profile card. */
  showStats?: boolean
}) {
  const recent = matchRatings.slice(0, 5)
  return (
    <div className="astro-card @container p-6">
      <h2 className="mb-4 font-display leading-none text-astro-text" style={{ fontSize: titleSize }}>
        {title}
      </h2>
      {recent.length === 0 ? (
        <NothingHere compact icon={<Scene kind="rating" />} body="No rated matches yet." />
      ) : (
        // Always five slots, so a short run doesn't leave the row lopsided.
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
          <div
            className={compact ? 'grid gap-2' : 'grid gap-2.5'}
            style={{
              gridTemplateColumns: compact ? 'repeat(5, minmax(0, 52px))' : 'repeat(5, minmax(0, 1fr))',
            }}
          >
            {recent.map((r) => {
              const c = tileColors(r.avg_rating)
              return (
                <div
                  key={r.match_id}
                  className={cn(
                    'font-display aspect-square min-w-0 border leading-none',
                    compact ? 'rounded-[9px] text-[20px]' : 'rounded-[11px] text-[30px]',
                  )}
                  style={{
                    background: c.background,
                    color: c.color,
                    borderColor: c.border,
                  }}
                >
                  <div className="flex size-full items-center justify-center">{r.avg_rating}</div>
                </div>
              )
            })}
            {Array.from({ length: 5 - recent.length }, (_, i) => (
              <div
                key={`empty-${i}`}
                aria-hidden="true"
                className={cn(
                  'aspect-square min-w-0 border border-dashed border-white/[0.09]',
                  compact ? 'rounded-[9px]' : 'rounded-[11px]',
                )}
              />
            ))}
          </div>
          {showStats && <FormStats all={matchRatings} recent={recent} />}
        </div>
      )}
      {summary && recent.length > 0 && <p className="mt-4 text-[13px] text-astro-text-muted [text-wrap:pretty]">{summary}</p>}
    </div>
  )
}

const mean = (rows: MatchRatingRow[]) => rows.reduce((sum, r) => sum + r.avg_rating, 0) / rows.length

function Stat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: string }) {
  return (
    <div className="min-w-[84px]">
      <div className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">{label}</div>
      <div className={cn('font-display text-[28px] leading-none', tone ?? 'text-astro-text')}>{value}</div>
      {note && <div className="mt-0.5 text-[11px] text-astro-text-dim">{note}</div>}
    </div>
  )
}

function FormStats({ all, recent }: { all: MatchRatingRow[]; recent: MatchRatingRow[] }) {
  const avg = mean(recent)
  const best = recent.reduce((b, r) => (r.avg_rating > b.avg_rating ? r : b))
  // With five or fewer games the run is the whole career, so there's nothing to compare against.
  const diff = all.length > recent.length ? avg - mean(all) : null
  const rounded = diff === null ? null : Math.round(diff * 10) / 10

  return (
    <div className="flex flex-wrap gap-x-8 gap-y-4 border-white/[0.07] @[34rem]:border-l @[34rem]:pl-8">
      <Stat label="Average" value={avg.toFixed(1)} note={`Last ${recent.length}`} />
      <Stat
        label="Best"
        value={best.avg_rating.toFixed(1)}
        note={new Date(best.played_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        })}
      />
      {rounded !== null && (
        <Stat
          label="Vs career"
          value={rounded === 0 ? 'Level' : `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`}
          note={`Career ${mean(all).toFixed(1)}`}
          tone={rounded === 0 ? 'text-astro-text-muted' : rounded > 0 ? 'text-astro-green' : 'text-[#e0483f]'}
        />
      )}
    </div>
  )
}
