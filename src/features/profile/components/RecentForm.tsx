import type { MatchRatingRow } from '../api'

function tileColors(rating: number) {
  if (rating >= 8) return { background: 'rgba(166,63,255,0.18)', color: '#c589ff', border: 'rgba(166,63,255,0.5)' }
  if (rating >= 6.5) return { background: '#182448', color: '#eef0f9', border: 'rgba(255,255,255,0.07)' }
  return { background: 'rgba(224,72,63,0.13)', color: '#e0483f', border: 'rgba(224,72,63,0.5)' }
}

export function RecentForm({
  matchRatings,
  title = 'Recent Form',
  titleSize = 30,
}: {
  matchRatings: MatchRatingRow[]
  title?: string
  titleSize?: 26 | 30
}) {
  const recent = matchRatings.slice(0, 5)
  return (
    <div className="astro-card p-6">
      <h2
        className="mb-4 font-display leading-none text-astro-text"
        style={{ fontSize: titleSize }}
      >
        {title}
      </h2>
      {recent.length === 0 ? (
        <p className="text-sm text-astro-text-dim">No rated matches yet.</p>
      ) : (
        // A fixed 5-column grid, not flex-1: with just one or two rated
        // matches, a flex-1 tile stretches (and aspect-square then
        // inflates its height) to fill the whole row. Grid columns stay
        // a fifth of the width regardless of how many tiles exist, so a
        // single tile renders at normal size with empty space after it.
        <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          {recent.map((r) => {
            const c = tileColors(r.avg_rating)
            return (
              <div
                key={r.match_id}
                className="font-display aspect-square min-w-0 rounded-[11px] border text-[30px] leading-none"
                style={{ background: c.background, color: c.color, borderColor: c.border }}
              >
                <div className="flex size-full items-center justify-center">{r.avg_rating}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
