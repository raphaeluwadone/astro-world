import { cn } from 'cn'

/** Page numbers to show: always the first and last, the current one and its neighbours, gaps as null. */
function pageList(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages))
  const sorted = [...keep].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]))
}

export function Pager({
  page,
  pageSize,
  total,
  onPageChange,
  noun = 'items',
  className,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  noun?: string
  className?: string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const btn = 'flex min-h-8 min-w-8 items-center justify-center rounded-[8px] border px-2 text-[12.5px] font-bold transition-colors disabled:opacity-35'

  return (
    <nav aria-label="Pages" className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="mr-auto text-[12px] text-astro-text-dim">
        {from}&ndash;{to} of {total} {noun}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)} className={cn(btn, 'border-white/[0.1] text-astro-text-muted hover:text-astro-text')}>
            &larr;
          </button>
          {pageList(page, pages).map((p, i) =>
            p == null ? (
              <span key={`gap-${i}`} className="px-1 text-astro-text-dim">
                &hellip;
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange(p)}
                className={cn(btn, p === page ? 'border-astro-cyan/60 bg-astro-cyan/[0.12] text-astro-text' : 'border-white/[0.1] text-astro-text-muted hover:text-astro-text')}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" aria-label="Next page" disabled={page === pages} onClick={() => onPageChange(page + 1)} className={cn(btn, 'border-white/[0.1] text-astro-text-muted hover:text-astro-text')}>
            &rarr;
          </button>
        </div>
      )}
    </nav>
  )
}
