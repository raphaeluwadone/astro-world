import type { ReactNode } from 'react'

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[7px] text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-muted">
      {children}
    </div>
  )
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <div className="mt-1.5 text-[11.5px] text-astro-text-dim">{children}</div>
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  type?: 'text' | 'number' | 'date' | 'time'
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className="flex min-h-[46px] w-full items-center rounded-[10px] border border-white/[0.12] bg-astro-surface-2 px-[15px] text-sm font-semibold text-astro-text focus:outline-none focus:ring-1 focus:ring-astro-accent"
      />
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}
