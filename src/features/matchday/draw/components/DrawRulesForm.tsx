import { cn } from 'cn'
import { Switch } from '@/components/ui/switch'
import { RATING_WINDOWS, type DrawRules, type RuleKey } from '../rules'

export const RULE_COPY: Record<RuleKey, { label: string; detail: string }> = {
  positions: { label: 'Positional balance', detail: 'Keepers, defenders and attackers spread evenly' },
  ratings: { label: 'Rating balance', detail: 'Sides as even as possible on player ratings' },
  neverPairs: { label: 'Never-together pairs', detail: 'Pairs on your list are always split' },
  noThreeWeeks: { label: 'No 3 weeks together', detail: 'Nobody shares a side 3 Sundays running' },
  freshPairs: { label: 'Fresh pairings', detail: 'Avoid pairs who played together last week' },
  splitCupWinners: { label: 'Split the cup winners', detail: 'Last Salami Cup winners go to different sides' },
  splitLastBest: { label: 'Split last week’s best', detail: 'The side that won the most games last week is broken up' },
  spreadNewcomers: { label: 'Spread newcomers', detail: 'Players with fewer than 3 Sundays are spread out' },
  spreadScorers: { label: 'Spread top scorers', detail: 'This season’s top scorers go to different sides' },
}

export const RULE_ORDER = Object.keys(RULE_COPY) as RuleKey[]

export function DrawRulesForm({ rules, onChange, disabled }: { rules: DrawRules; onChange: (rules: DrawRules) => void; disabled?: boolean }) {
  return (
    <ul className="overflow-hidden rounded-[12px] border border-white/[0.08]">
      {RULE_ORDER.map((key, i) => (
        <li key={key} className={cn('px-3.5 py-2.5', i > 0 && 'border-t border-white/[0.06]')}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div id={`rule-${key}`} className="text-[13.5px] font-bold text-astro-text">
                {RULE_COPY[key].label}
              </div>
              <div className="text-[12px] text-astro-text-muted">{RULE_COPY[key].detail}</div>
            </div>
            <Switch checked={rules[key]} disabled={disabled} onCheckedChange={(on) => onChange({ ...rules, [key]: on })} aria-labelledby={`rule-${key}`} />
          </div>
          {key === 'ratings' && rules.ratings && (
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Ratings from">
              {RATING_WINDOWS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  role="radio"
                  aria-checked={rules.ratingWindow === w.value}
                  disabled={disabled}
                  onClick={() => onChange({ ...rules, ratingWindow: w.value })}
                  className={cn(
                    'min-h-8 rounded-full border px-3 text-xs font-bold',
                    rules.ratingWindow === w.value ? 'border-astro-cyan/60 bg-astro-cyan/[0.12] text-astro-text' : 'border-white/[0.1] text-astro-text-muted',
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
