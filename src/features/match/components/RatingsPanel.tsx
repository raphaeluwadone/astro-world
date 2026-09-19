import type { RatingsIntegrity } from '../api'

export function RatingsPanel({
  integrity,
  isOpen,
}: {
  integrity: RatingsIntegrity
  isOpen: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-astro-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Ratings</h2>
        <div
          className={`text-[11px] font-extrabold uppercase tracking-[0.1em] ${isOpen ? 'text-astro-cyan' : 'text-astro-green'}`}
        >
          {isOpen ? 'Open' : 'Closed'}
        </div>
      </div>
      <div className="mb-4 flex gap-2.5">
        <div className="flex-1 rounded-[11px] bg-astro-surface-2 px-[15px] py-[13px]">
          <div className="mb-1 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">
            Voters
          </div>
          <div className="font-display text-[32px] leading-none text-astro-text">
            {integrity.voter_count ?? '—'}
          </div>
        </div>
        <div className="flex-1 rounded-[11px] bg-astro-surface-2 px-[15px] py-[13px]">
          <div className="mb-1 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">
            Match avg
          </div>
          <div className="font-display text-[32px] leading-none text-astro-text">
            {integrity.match_avg ?? '—'}
          </div>
        </div>
        <div className="flex-1 rounded-[11px] bg-astro-surface-2 px-[15px] py-[13px]">
          <div className="mb-1 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">
            Lowest
          </div>
          <div className="font-display text-[32px] leading-none text-astro-red">
            {integrity.lowest_avg ?? '—'}
          </div>
        </div>
      </div>
      <p className="text-[13px] text-astro-text-muted">
        {isOpen
          ? "Numbers stay hidden while voting's still open, watching them tick up would give away who voted."
          : 'Every score is an average of the other eleven. Nobody sees who gave what.'}
      </p>
    </div>
  )
}
