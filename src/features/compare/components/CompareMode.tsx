import { useNavigate } from '@tanstack/react-router'
import { PICK_COLOURS } from '../metrics'

export function CompareToggle({ on, onClick, className }: { on: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className ?? ''} rounded-[11px] border bg-astro-surface-2 px-[18px] py-2.5 text-[12.5px] font-extrabold ${
        on ? 'border-white/[0.14] text-astro-text-muted' : 'border-[rgba(166,63,255,0.45)] text-astro-accent-soft hover:border-astro-accent'
      }`}
    >
      {on ? 'Cancel' : 'Compare players'}
    </button>
  )
}

/** Sticky bar listing the picks, with the button that opens Compare. */
export function CompareBar({ picks, nameOf, onRemove, hint }: { picks: string[]; nameOf: (id: string) => string | undefined; onRemove: (id: string) => void; hint: string }) {
  const navigate = useNavigate()
  return (
    <div className="sticky bottom-[18px] z-20 mt-5 flex flex-wrap items-center gap-3.5 rounded-[14px] border-[1.5px] border-[rgba(166,63,255,0.55)] bg-[#1b2650] px-[18px] py-[15px] shadow-[0_18px_40px_rgba(0,0,0,0.5)] max-md:bottom-[84px]">
      <div className="shrink-0 text-[9.5px] font-extrabold uppercase tracking-[0.13em] text-astro-accent-soft">Comparing</div>
      <div className="flex min-w-0 flex-[1_1_200px] flex-wrap gap-1.5">
        {picks.length === 0 && <div className="text-[12.5px] text-astro-text-muted">{hint}</div>}
        {picks.map((id, k) => (
          <button
            key={id}
            type="button"
            onClick={() => onRemove(id)}
            className="rounded-lg px-[11px] py-[7px] text-[11.5px] font-extrabold text-black"
            style={{ background: PICK_COLOURS[k] }}
          >
            {nameOf(id)} ×
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={picks.length < 2}
        onClick={() => navigate({ to: '/compare', search: { ids: picks.join(',') } })}
        className="shrink-0 rounded-[11px] bg-astro-accent px-5 py-[13px] text-[13.5px] font-extrabold text-astro-on-accent disabled:bg-astro-surface disabled:text-astro-text-dim"
      >
        {picks.length < 2 ? `Pick ${2 - picks.length} more` : `Compare ${picks.length}`}
      </button>
    </div>
  )
}
