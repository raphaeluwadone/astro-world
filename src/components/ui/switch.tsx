import { cn } from 'cn'

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  ...aria
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-55',
        checked ? 'border-astro-accent/60 bg-astro-accent/70' : 'border-white/15 bg-white/[0.08] hover:bg-white/[0.14]',
        className,
      )}
      {...aria}
    >
      <span className={cn('absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white transition-[left]', checked ? 'left-[18px]' : 'left-[2px]')} />
    </button>
  )
}
