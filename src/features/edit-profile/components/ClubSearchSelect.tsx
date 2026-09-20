import { useRef, useState } from 'react'
import { InlineLoader } from '@/components/states/InlineLoader'
import { useDebounced } from '@/lib/useDebounced'
import { useSearchClubs } from '../hooks'

export function ClubSearchSelect({
  value,
  logoUrl,
  onSelect,
}: {
  value: string
  logoUrl: string | null
  onSelect: (club: { name: string; logo_url: string | null }) => void
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounced(query, 400)
  const { data: results = [], isFetching } = useSearchClubs(open ? debouncedQuery : '')
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  function pick(club: { name: string; logo_url: string | null }) {
    setQuery(club.name)
    onSelect(club)
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 rounded-[10px] border border-white/[0.12] bg-astro-surface-2 px-[15px] py-3">
        {logoUrl && query === value ? (
          <img src={logoUrl} alt="" className="size-5 shrink-0 object-contain" />
        ) : null}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            // Typing away from the picked name means it's a free-text
            // entry again, not a verified club: drop the stale crest
            // rather than showing a badge for a different name.
            if (e.target.value !== value) onSelect({ name: e.target.value, logo_url: null })
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setOpen(false), 150)
          }}
          placeholder="Search for a club"
          className="min-w-0 flex-1 bg-transparent text-sm text-astro-text placeholder:text-astro-text-dim focus:outline-none"
        />
        {isFetching && <InlineLoader size={14} className="shrink-0 text-astro-text-dim" />}
      </div>

      {open && debouncedQuery.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-20 mt-1.5 flex max-h-64 flex-col gap-1 overflow-y-auto rounded-[10px] border border-white/[0.12] bg-astro-surface-2 p-1.5 shadow-lg">
          {!isFetching && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-astro-text-dim">No club by that name.</p>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              // onMouseDown, not onClick: fires before the input's onBlur
              // closes the dropdown, so the pick still registers.
              onMouseDown={() => {
                clearTimeout(blurTimeout.current)
                pick({ name: c.name, logo_url: c.logo_url })
              }}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-astro-accent/10"
            >
              {c.logo_url ? (
                <img src={c.logo_url} alt="" className="size-6 shrink-0 object-contain" />
              ) : (
                <div className="size-6 shrink-0 rounded bg-astro-bg" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-astro-text">{c.name}</div>
                {c.country && <div className="text-xs text-astro-text-dim">{c.country}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
