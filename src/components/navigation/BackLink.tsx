import { Link, useCanGoBack, useRouter, type LinkProps } from '@tanstack/react-router'
import { cn } from 'cn'
import type { MouseEvent } from 'react'

/** Goes back to wherever the user came from; falls back to `to` when they landed here directly. */
export function BackLink({ to, label, className }: { to: LinkProps['to']; label: string; className?: string }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  const onClick = (e: MouseEvent) => {
    if (!canGoBack || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    router.history.back()
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 self-start text-[13px] font-bold text-astro-text-muted no-underline hover:text-astro-text', className)}
    >
      &larr; {canGoBack ? 'Back' : label}
    </Link>
  )
}
