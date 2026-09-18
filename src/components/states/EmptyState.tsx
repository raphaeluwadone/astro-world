import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  body,
  meta,
}: {
  icon: ReactNode
  title: string
  body: string
  meta?: string
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
      </div>
    </div>
  )
}
