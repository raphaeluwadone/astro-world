import type { TagPoolRow } from '../api'

/**
 * Tag creation/voting ("three votes and it's real") is still an unconfirmed
 * product rule per the design's own open questions, so the pool is
 * read-only for now, and the compose row is visibly disabled rather than
 * wired to a rule nobody's confirmed yet.
 */
export function TagPool({ tags }: { tags: TagPoolRow[] }) {
  return (
    <div className="astro-card p-[22px]">
      <h2 className="mb-1.5 font-display text-[26px] leading-none text-astro-text">Tag a Teammate</h2>
      <p className="mb-3.5 text-[13px] text-astro-text-muted [text-wrap:pretty]">
        Vote a playstyle onto someone. Enough votes and it sticks to their card.
      </p>
      <div className="mb-3.5 flex flex-wrap gap-2">
        {tags.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-border bg-astro-surface-2 px-3 py-[7px] text-xs font-bold text-astro-text-muted"
          >
            {t.label}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex min-h-[42px] flex-1 items-center rounded-[9px] border border-white/[0.12] bg-astro-surface-2 px-3 text-[12.5px] text-astro-text-dim">
          Invent a new tag&hellip;
        </div>
        <div className="flex min-h-[42px] cursor-not-allowed items-center rounded-[9px] border border-[rgba(166,63,255,0.4)] bg-astro-surface-2 px-3.5 text-[12.5px] font-extrabold text-astro-accent-soft opacity-60">
          Create
        </div>
      </div>
      <div className="mt-2 text-[11.5px] text-astro-text-dim [text-wrap:pretty]">
        Not wired up yet: the voting rule ("three votes and it's real") hasn't been confirmed.
      </div>
    </div>
  )
}
