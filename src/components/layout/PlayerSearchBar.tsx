import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useRef } from 'react'
import { cn } from 'cn'

/** Typing here is a way into Players: it navigates there and applies the query. */
export function PlayerSearchBar({ className }: { className?: string }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const location = useRouterState({ select: (s) => s.location })
  const onPlayers = location.pathname === '/players'
  const q = onPlayers ? ((location.search as { q?: string }).q ?? '') : ''

  function search(value: string) {
    navigate({ to: '/players', search: { q: value || undefined }, replace: onPlayers })
  }

  return (
    <label
      className={cn(
        'flex min-w-0 cursor-text items-center gap-2.5 rounded-[11px] border border-white/[0.09] bg-astro-surface px-3.5 focus-within:border-astro-accent/50',
        className,
      )}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#6d7496" className="shrink-0" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10.4 2.4a8 8 0 1 0 4.9 14.3l4.5 4.5 1.7-1.7-4.5-4.5A8 8 0 0 0 10.4 2.4Zm0 2.2a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6Z"
        />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => search(e.target.value)}
        placeholder="Search players"
        aria-label="Search players"
        className="min-w-0 flex-1 bg-transparent py-3 text-[13px] font-semibold text-astro-text placeholder:text-astro-text-dim focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            search('')
            inputRef.current?.focus()
          }}
          aria-label="Clear search"
          className="shrink-0 text-base leading-none text-astro-text-dim hover:text-astro-text"
        >
          &times;
        </button>
      )}
    </label>
  )
}
