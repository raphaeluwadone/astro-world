import { Link } from '@tanstack/react-router'
import type { ArticleRow } from '@/features/articles/api'
import { usePublicRosterSize } from '@/features/auth/hooks'
import { useCurrentDuesQuarter, useDuesPayments } from '@/features/kitty/hooks'
import { isRuleChangeRecent } from './RulesChangedStrip'

const DAY_MS = 24 * 60 * 60 * 1000

function Tile({ to, label, cta, amber }: { to: string; label: string; cta: string; amber?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex-[1_1_44%] rounded-xl border bg-astro-surface p-[13px] no-underline ${amber ? 'border-astro-amber/45' : 'border-white/[0.07]'}`}
    >
      <div className={`mb-1 text-[9.5px] font-extrabold uppercase tracking-[0.12em] ${amber ? 'text-astro-amber' : 'text-astro-text-dim'}`}>
        {label}
      </div>
      <div className={`text-[13px] font-extrabold ${amber ? 'text-astro-text' : 'text-astro-accent'}`}>{cta} &rarr;</div>
    </Link>
  )
}

/** Mobile Home only: the way into sections the bottom bar leaves out. */
export function QuickLinks({
  articles,
  playerId,
  newHonours,
  awardsWon,
}: {
  articles: ArticleRow[]
  playerId: string | null
  newHonours: number
  awardsWon: { won: number; total: number } | null
}) {
  const { data: rosterSize } = usePublicRosterSize()
  const { data: dues } = useCurrentDuesQuarter()
  const { data: payments = [] } = useDuesPayments(dues?.id)

  const weekAgo = Date.now() - 7 * DAY_MS
  const newArticles = articles.filter((a) => a.published_at && new Date(a.published_at).getTime() > weekAgo).length
  const owesDues = !!dues && !!playerId && !payments.some((p) => p.player_id === playerId)
  const dueInDays = dues ? Math.ceil((new Date(dues.due_date).getTime() - Date.now()) / DAY_MS) : 0

  return (
    <div className="mb-5 flex flex-wrap gap-2.5 md:hidden">
      <Tile to="/players" label="Players" cta={rosterSize != null ? `Browse ${rosterSize}` : 'Browse'} />
      <Tile to="/articles" label="Articles" cta={newArticles > 0 ? `${newArticles} new` : 'Read'} />
      <Tile to="/rules" label="Rules" cta={isRuleChangeRecent() ? 'Amended' : 'Read'} />
      {owesDues ? (
        <Tile
          to="/kitty"
          amber
          label={dueInDays >= 0 ? `Kitty · ${dueInDays}d` : 'Kitty · overdue'}
          cta={`Q${dues.quarter} dues due`}
        />
      ) : (
        <Tile to="/kitty" label="Kitty" cta={dues ? 'Paid up' : 'Causes'} />
      )}
      <Tile to="/honours" label="Honours" cta={newHonours > 0 ? `${newHonours} new` : 'See all'} />
      <Tile to="/awards" label="Awards" cta={awardsWon ? `${awardsWon.won} / ${awardsWon.total} won` : 'Browse'} />
      <Link
        to="/memorial"
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.07] bg-astro-surface px-[13px] py-2.5 no-underline"
      >
        <div
          className="font-display flex size-6 shrink-0 items-center justify-center rounded-[7px] border border-astro-accent/40 bg-astro-surface-2 text-[13px] text-astro-accent-soft"
          style={{ clipPath: 'polygon(0 0,100% 0,100% 74%,74% 100%,0 100%)' }}
        >
          13
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">In memory</div>
          <div className="text-xs font-extrabold text-astro-text-muted">Salami</div>
        </div>
      </Link>
    </div>
  )
}
