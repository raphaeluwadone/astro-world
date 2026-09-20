import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  body,
  meta,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  meta?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      {icon}
      <div>
        <div className="mb-1.5 text-[15px] font-bold text-astro-text">{title}</div>
        <p className="mx-auto max-w-[36ch] text-[13px] leading-[1.55] text-astro-text-muted [text-wrap:pretty]">
          {body}
        </p>
        {meta && <div className="mt-3 text-[11.5px] text-astro-text-dim">{meta}</div>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 rounded-[10px] border border-astro-accent/45 bg-astro-surface-2 px-4 py-2.5 text-xs font-extrabold text-astro-accent-soft"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
