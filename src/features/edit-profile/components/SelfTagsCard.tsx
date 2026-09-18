import { useState } from 'react'
import type { PlayerTagRow } from '@/features/profile/api'
import type { TagPoolRow } from '@/features/community/api'

const MAX_SELF_TAGS = 2

export function SelfTagsCard({
  allTags,
  tagPool,
  onAdd,
  onRemove,
  isMutating,
}: {
  allTags: PlayerTagRow[]
  tagPool: TagPoolRow[]
  onAdd: (tagId: string) => void
  onRemove: (playerTagRowId: string) => void
  isMutating: boolean
}) {
  const [picking, setPicking] = useState(false)
  const selfTags = allTags.filter((t) => t.source === 'self')
  const appliedLabels = new Set(allTags.map((t) => t.label))
  const available = tagPool.filter((t) => !appliedLabels.has(t.label))
  const atLimit = selfTags.length >= MAX_SELF_TAGS

  return (
    <div className="astro-card p-6">
      <h2 className="mb-1.5 font-display text-[28px] leading-none text-astro-text">Your Own Tags</h2>
      <p className="mb-4 text-[13px] text-astro-text-dim">
        Two of your own. The rest are voted onto you, and you can&rsquo;t take those off.
      </p>
      <div className="flex flex-wrap gap-2">
        {selfTags.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-[9px] rounded-lg border border-[rgba(166,63,255,0.4)] bg-[rgba(166,63,255,0.16)] px-3 py-2 text-[12.5px] font-extrabold text-astro-accent-soft"
          >
            {t.label}
            <button
              type="button"
              disabled={isMutating}
              onClick={() => onRemove(t.id)}
              aria-label={`Remove ${t.label}`}
              className="disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.6 3.2 12 10.6 19.4 3.2 20.8 4.6 13.4 12l7.4 7.4-1.4 1.4L12 13.4 4.6 20.8 3.2 19.4 10.6 12 3.2 4.6Z" />
              </svg>
            </button>
          </div>
        ))}
        {!atLimit && !picking && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex items-center gap-[7px] rounded-lg border border-dashed border-[rgba(166,63,255,0.4)] bg-astro-surface-2 px-3 py-2 text-[12.5px] font-bold text-astro-text-muted hover:text-astro-text"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.5 3.2h3v7.3h7.3v3h-7.3v7.3h-3v-7.3H3.2v-3h7.3Z" />
            </svg>
            Add a tag
          </button>
        )}
      </div>

      {picking && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {available.length === 0 ? (
            <p className="text-sm text-astro-text-dim">No tags left in the pool to add.</p>
          ) : (
            available.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={isMutating}
                onClick={() => {
                  onAdd(t.id)
                  setPicking(false)
                }}
                className="rounded-lg border border-border bg-astro-surface-2 px-3 py-[7px] text-xs font-bold text-astro-text-muted hover:border-[rgba(166,63,255,0.5)] hover:text-astro-text disabled:opacity-50"
              >
                {t.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
