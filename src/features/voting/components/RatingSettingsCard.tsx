import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { useRatingsOpenToEveryone, useSetRatingsOpenToEveryone } from '../hooks'

export function RatingSettingsCard() {
  const { data: everyone = false, isLoading } = useRatingsOpenToEveryone()
  const set = useSetRatingsOpenToEveryone()
  return (
    <div className="astro-card max-w-lg p-6">
      <h2 className="mb-1 font-display text-[28px] leading-none text-astro-text">Ratings</h2>
      <p className="mb-4 text-xs text-astro-text-dim">Applies to the matchday being rated now and every one after.</p>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div id="ratings-open-to-everyone" className="text-[13.5px] font-bold text-astro-text">
            Open to everyone
          </div>
          <div className="text-[12px] text-astro-text-muted">
            {everyone ? 'Every member can rate, whether they played or not.' : 'Only players from the matchday can rate.'}
          </div>
        </div>
        <Switch
          checked={everyone}
          disabled={isLoading || set.isPending}
          onCheckedChange={(v) => set.mutate(v, { onError: () => toast.error('Couldn’t change that. Try again.') })}
          aria-labelledby="ratings-open-to-everyone"
        />
      </div>
    </div>
  )
}
