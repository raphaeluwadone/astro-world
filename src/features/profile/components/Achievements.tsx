import { usePlayerAwards } from '../hooks'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Computed, not stored: see project memory, achievements are derived from stats, never a stored table. */
function computeAchievements(stats: { appearances: number; goals: number; motm: number }) {
  const badges: string[] = []
  if (stats.appearances >= 10) badges.push('10 Appearances')
  if (stats.appearances >= 50) badges.push('50 Appearances')
  if (stats.goals >= 10) badges.push('10 Goals')
  if (stats.motm >= 1) badges.push('Man of the Match')
  if (stats.motm >= 3) badges.push('3x Man of the Match')
  return badges
}

export function Achievements({
  playerId,
  stats,
}: {
  playerId: string
  stats: { appearances: number; goals: number; motm: number }
}) {
  const { data: awards = [] } = usePlayerAwards(playerId)
  const badges = computeAchievements(stats)
  const hasAny = badges.length > 0 || awards.length > 0
  return (
    <div className="astro-card p-6">
      <h2 className="mb-4 font-display text-[30px] leading-none text-astro-text">Achievements</h2>
      {!hasAny ? (
        <p className="text-sm text-astro-text-dim">Nothing earned yet.</p>
      ) : (
        <div className="flex flex-wrap gap-[9px]">
          {awards.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-full border border-[rgba(56,189,248,0.32)] bg-astro-surface-2 px-3.5 py-2 transition-transform hover:-translate-y-[3px] hover:-rotate-2"
              title={a.stat}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#38bdf8">
                <path d="M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z" />
              </svg>
              <span className="text-[12.5px] font-bold text-astro-text">
                {a.award_name} &middot; {MONTHS[a.month - 1]} {a.year}
              </span>
            </div>
          ))}
          {badges.map((b) => (
            <div
              key={b}
              className="flex items-center gap-2 rounded-full border border-[rgba(166,63,255,0.22)] bg-astro-surface-2 px-3.5 py-2 transition-transform hover:-translate-y-[3px] hover:-rotate-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#a63fff">
                <path d="M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z" />
              </svg>
              <span className="text-[12.5px] font-bold text-astro-text">{b}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
