import { Link } from '@tanstack/react-router'
import { formatAmendmentDate, LATEST_AMENDMENT } from '@/features/rules/content'

const SHOW_FOR_DAYS = 21

export const RULES_NOTICE_ID = `rules:${LATEST_AMENDMENT.date}`

export function isRuleChangeRecent(now = new Date()) {
  const effective = new Date(`${LATEST_AMENDMENT.date}T00:00:00`)
  const age = (now.getTime() - effective.getTime()) / (24 * 60 * 60 * 1000)
  return age >= 0 && age <= SHOW_FOR_DAYS
}

export function RulesChangedStrip() {
  const a = LATEST_AMENDMENT
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-astro-amber/50 pr-12 bg-[linear-gradient(120deg,rgba(242,169,59,0.16),rgba(242,169,59,0.04))] px-5 py-[18px]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#f2a93b" className="shrink-0" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2Zm1 4.4v5.8l4 2.4-1 1.7-5-3V6.8Z" />
      </svg>
      <div className="min-w-0 flex-[1_1_300px]">
        <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-astro-amber">
          Rules changed &middot; {formatAmendmentDate(a.date, { day: 'numeric', month: 'short' })}
        </div>
        <div className="font-display mb-1 text-[26px] leading-none text-astro-text">{a.headline}</div>
        <p className="text-[13px] leading-[1.5] text-astro-text [text-wrap:pretty]">{a.text}</p>
      </div>
      <Link
        to="/rules"
        className="shrink-0 rounded-[10px] bg-astro-amber px-[17px] py-[11px] text-[12.5px] font-extrabold text-astro-on-amber no-underline"
      >
        Read the changes
      </Link>
    </div>
  )
}
