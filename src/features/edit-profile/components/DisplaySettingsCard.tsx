import { Switch } from '@/components/ui/switch'
import { setHoverCards, useHoverCards } from '@/lib/hoverCards'

export function DisplaySettingsCard() {
  const hoverCards = useHoverCards()
  return (
    <div className="astro-card p-6">
      <h2 className="mb-1 font-display text-[28px] leading-none text-astro-text">Display</h2>
      <p className="mb-4 text-xs text-astro-text-dim">Saved on this device.</p>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-astro-bg/60 px-4 py-3">
        <div className="min-w-0">
          <div id="pref-hover-cards" className="text-sm font-bold text-astro-text">
            Hover cards
          </div>
          <div className="text-[12px] text-astro-text-muted">Quick info on players, badges, traits and the cup when you hover or tap</div>
        </div>
        <Switch checked={hoverCards} onCheckedChange={setHoverCards} aria-labelledby="pref-hover-cards" />
      </div>
    </div>
  )
}
