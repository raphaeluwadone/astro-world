import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { NO_EMAILS, type EmailPrefs } from '@/features/notifications/api'
import { useEmailPrefs, useSaveEmailPrefs } from '@/features/notifications/hooks'

const OPT_IN: { key: keyof EmailPrefs; label: string; detail: string }[] = [
  { key: 'email_badges', label: 'Badges', detail: 'When you earn one or share one' },
  { key: 'email_dues', label: 'Dues', detail: 'When dues are due, overdue, or marked paid' },
  { key: 'email_matchday', label: 'Spot confirmations', detail: 'When you grab a spot for Sunday' },
]

const ALWAYS = [
  { label: 'Account', detail: 'Confirm email, password, change of email' },
  { label: 'Roster claim', detail: 'When an admin approves your claim' },
]

export function EmailSettingsCard() {
  const { data: prefs = NO_EMAILS, isLoading } = useEmailPrefs()
  const save = useSaveEmailPrefs()
  const card = useRef<HTMLDivElement>(null)

  // The page renders after its data loads, too late for the router's own hash scroll.
  useEffect(() => {
    if (window.location.hash === '#email-settings') card.current?.scrollIntoView({ block: 'start' })
  }, [])

  const toggle = (key: keyof EmailPrefs, on: boolean) =>
    save.mutate({ ...prefs, [key]: on }, { onError: () => toast.error('Couldn’t save that. Try again.') })

  return (
    <div ref={card} id="email-settings" className="astro-card scroll-mt-6 p-6">
      <h2 className="mb-1 font-display text-[28px] leading-none text-astro-text">Email settings</h2>
      <p className="mb-4 text-xs text-astro-text-dim [text-wrap:pretty]">
        Everything shows in your notifications. These also come by email, but only once you turn them on.
      </p>

      <div className="mb-3 overflow-hidden rounded-xl bg-astro-bg/60">
        <div className="flex items-baseline justify-between px-4 pb-1.5 pt-3">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">Opt-in</span>
          <span className="text-[11.5px] text-astro-text-dim">Off until you turn them on</span>
        </div>
        {OPT_IN.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-2.5">
            <div className="min-w-0">
              <div id={`pref-${row.key}`} className="text-sm font-bold text-astro-text">
                {row.label}
              </div>
              <div className="text-[12px] text-astro-text-muted">{row.detail}</div>
            </div>
            <Switch checked={prefs[row.key]} disabled={isLoading} onCheckedChange={(on) => toggle(row.key, on)} aria-labelledby={`pref-${row.key}`} />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl bg-astro-bg/60">
        <div className="flex items-baseline justify-between px-4 pb-1.5 pt-3">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">Always sent</span>
          <span className="text-[11.5px] text-astro-text-dim">About your account</span>
        </div>
        {ALWAYS.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-2.5">
            <div className="min-w-0">
              <div className="text-sm font-bold text-astro-text">{row.label}</div>
              <div className="text-[12px] text-astro-text-muted">{row.detail}</div>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-astro-text-dim">Always</span>
          </div>
        ))}
      </div>
    </div>
  )
}
