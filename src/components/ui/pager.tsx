import { cn } from 'cn'

/** Page numbers to show: always the first and last, the current one and its neighbours, gaps as null. */
function pageList(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages))
  const sorted = [...keep].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]))
}

const pill = 'flex h-8 min-w-8 items-center justify-center rounded-[9px] px-2 text-[13px] font-bold transition-colors'
const idle = 'border border-white/[0.09] bg-astro-surface-2 text-astro-text-muted hover:border-white/20 hover:text-astro-text'

function Arrow({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === 'prev' ? 'Previous page' : 'Next page'}
      disabled={disabled}
      onClick={onClick}
      className={cn(pill, idle, 'w-8 px-0 text-astro-text disabled:pointer-events-none disabled:opacity-30')}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={dir === 'prev' ? 'M15.6 3.6 7.2 12l8.4 8.4Z' : 'M8.4 3.6 16.8 12l-8.4 8.4Z'} />
      </svg>
    </button>
  )
}

/** Numbered pills. `page` is 1-based. `accent` recolours the current page, e.g. gold for the Salami Cup. */
export function Pager({
  page,
  pageSize,
  total,
  onPageChange,
  noun = 'items',
  accent = '#a63fff',
  className,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  noun?: string
  accent?: string
  className?: string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <nav aria-label="Pages" className={cn('flex flex-wrap items-center gap-x-2 gap-y-2.5', className)}>
      <span className="mr-auto text-[12px] text-astro-text-dim">
        {from}&ndash;{to} of {total} {noun}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-1.5">
          <Arrow dir="prev" disabled={page === 1} onClick={() => onPageChange(page - 1)} />
          {pageList(page, pages).map((p, i) =>
            p == null ? (
              <span key={`gap-${i}`} className="px-0.5 text-astro-text-dim">
                &hellip;
              </span>
            ) : p === page ? (
              <span key={p} aria-current="page" className={pill} style={{ background: accent, color: '#0a0f1f' }}>
                {p}
              </span>
            ) : (
              <button key={p} type="button" onClick={() => onPageChange(p)} className={cn(pill, idle)}>
                {p}
              </button>
            ),
          )}
          <Arrow dir="next" disabled={page === pages} onClick={() => onPageChange(page + 1)} />
        </div>
      )}
    </nav>
  )
}
