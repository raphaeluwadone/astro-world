import type { MentionedRow } from '../api'

export function MostMentioned({ mentioned }: { mentioned: MentionedRow[] }) {
  return (
    <div className="astro-card p-[22px]">
      <h2 className="mb-3.5 font-display text-[26px] leading-none text-astro-text">Most Mentioned</h2>
      {mentioned.length === 0 ? (
        <p className="text-sm text-astro-text-dim">Nobody's been called out yet.</p>
      ) : (
        <div className="flex flex-col gap-[9px]">
          {mentioned.map((m) => (
            <div key={m.player_id} className="flex items-center gap-[11px]">
              <div
                className="size-8 shrink-0 rounded-[9px]"
                style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
              />
              <div className="min-w-0 flex-1 truncate text-[13px] font-extrabold text-astro-text">
                {m.nickname}
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[rgba(56,189,248,0.3)] bg-astro-surface-2 px-[11px] py-1">
                <span className="text-[11.5px] font-extrabold text-astro-cyan">{m.count}</span>
                <span className="text-[11px] text-astro-text-dim">mentions</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
