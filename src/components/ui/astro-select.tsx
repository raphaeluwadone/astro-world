import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Popover } from 'radix-ui'
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react'
import { cn } from 'cn'

export type SelectOption = { value: string; label: string }

const SEARCH_THRESHOLD = 8

const TRIGGER_SIZE = {
  sm: 'h-9 rounded-lg px-2.5 text-xs',
  md: 'h-11 rounded-[10px] px-3 text-sm',
}

/** Replaces native <select>. Lists longer than SEARCH_THRESHOLD get a filter box. */
export function AstroSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  size = 'md',
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  size?: keyof typeof TRIGGER_SIZE
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const searchable = options.length > SEARCH_THRESHOLD

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
  }, [options, query])

  const selected = options.find((o) => o.value === value)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setQuery('')
      setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    }
  }

  function choose(option: SelectOption) {
    onValueChange(option.value)
    setOpen(false)
  }

  function handleListKeys(e: KeyboardEvent) {
    const last = filtered.length - 1
    if (e.key === 'ArrowDown') setActive((i) => Math.min(i + 1, last))
    else if (e.key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Enter' && filtered[active]) choose(filtered[active])
    else return
    e.preventDefault()
  }

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const activeId = filtered[active] ? `${listId}-${active}` : undefined

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              handleOpenChange(true)
            }
          }}
          className={cn(
            'group flex min-w-0 items-center justify-between gap-2 border border-white/10 bg-astro-surface-2 text-left font-bold text-astro-text outline-none transition-colors',
            'hover:border-white/20 focus-visible:border-astro-accent/70 data-[state=open]:border-astro-accent/70',
            'disabled:cursor-not-allowed disabled:opacity-50',
            TRIGGER_SIZE[size],
            className,
          )}
        >
          <span className={cn('truncate', !selected && 'font-semibold text-astro-text-dim')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-astro-text-dim transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(e) => {
            if (searchable) return
            e.preventDefault()
            listRef.current?.focus()
          }}
          className="z-50 w-(--radix-popover-trigger-width) min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-astro-surface shadow-[0_18px_40px_rgba(0,0,0,0.45)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-3">
              <SearchIcon className="size-3.5 shrink-0 text-astro-text-dim" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={handleListKeys}
                placeholder="Search…"
                role="searchbox"
                aria-controls={listId}
                aria-activedescendant={activeId}
                className="h-10 w-full bg-transparent text-[13px] text-astro-text outline-none placeholder:text-astro-text-dim"
              />
            </div>
          )}
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={searchable ? undefined : activeId}
            onKeyDown={searchable ? undefined : handleListKeys}
            className="max-h-[min(280px,var(--radix-popover-content-available-height))] overflow-y-auto p-1.5 outline-none"
          >
            {filtered.length === 0 ? (
              <div className="px-2.5 py-3 text-center text-xs text-astro-text-dim">No matches</div>
            ) : (
              filtered.map((o, i) => {
                const isSelected = o.value === value
                return (
                  <div
                    key={o.value}
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(o)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[13px]',
                      i === active ? 'bg-white/[0.06] text-astro-text' : 'text-astro-text-muted',
                      isSelected && 'font-extrabold text-astro-text',
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSelected && <CheckIcon className="size-3.5 shrink-0 text-astro-accent-soft" />}
                  </div>
                )
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
