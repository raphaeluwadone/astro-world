import { useNavigate } from '@tanstack/react-router'
import { useMemo, type ReactNode } from 'react'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { NothingHere } from '@/components/states/NothingHere'
import { Scene, type SceneKind } from '@/components/states/Scene'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { seasonStart, type CompareRow, type CompareScope } from './api'
import { DuelView } from './components/DuelView'
import { FieldView } from './components/FieldView'
import { HexagonView } from './components/HexagonView'
import { PickerChips } from './components/PickerChips'
import { ShortlistView } from './components/ShortlistView'
import { useCompare } from './hooks'
import { MAX_PICKS, isKeeper, scopeConfig, type ViewProps } from './metrics'

export type CompareView = 'duel' | 'field' | 'radar' | 'table'

export interface CompareSearch {
  ids?: string
  view?: CompareView
  scope?: CompareScope
}

const VIEWS: Array<[CompareView, string]> = [
  ['duel', 'Duel'],
  ['field', 'The field'],
  ['radar', 'Hexagon'],
  ['table', 'Shortlist'],
]

const SCOPES: Array<[CompareScope, string]> = [
  ['season', 'This season'],
  ['career', 'Career'],
  ['cup', 'Salami Cup'],
]

const VIEW_COMPONENTS: Record<CompareView, (props: ViewProps) => ReactNode> = {
  duel: DuelView,
  field: FieldView,
  radar: HexagonView,
  table: ShortlistView,
}

function Tab({ on, label, accent, onClick }: { on: boolean; label: string; accent: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={
        on
          ? 'whitespace-nowrap rounded-[9px] border px-[13px] py-2 text-xs font-extrabold text-black'
          : 'whitespace-nowrap rounded-[9px] border border-white/[0.09] bg-astro-surface-2 px-[13px] py-2 text-xs font-semibold text-astro-text-muted hover:text-astro-text'
      }
      style={on ? { background: accent, borderColor: accent } : undefined}
    >
      {label}
    </button>
  )
}

function defaultPicks(rows: CompareRow[], me: string | undefined, rank: (p: CompareRow) => number) {
  const ranked = [...rows].sort((a, b) => rank(b) - rank(a)).map((p) => p.id)
  const start = me && rows.some((p) => p.id === me) ? [me] : []
  return [...start, ...ranked.filter((id) => id !== me)].slice(0, 3)
}

export function ComparePage({ search }: { search: CompareSearch }) {
  const navigate = useNavigate()
  const { player } = useCurrentPlayer()
  const view = search.view ?? 'duel'
  const scope = search.scope ?? 'season'
  const config = scopeConfig(scope)
  const { data, isLoading, isError, refetch } = useCompare(scope)
  const rows = useMemo(() => data?.rows ?? [], [data])

  const picks = useMemo(() => {
    const byId = new Map(rows.map((p) => [p.id, p]))
    const fromUrl = (search.ids ?? '').split(',').filter((id) => byId.has(id)).slice(0, MAX_PICKS)
    const ids = fromUrl.length ? fromUrl : defaultPicks(rows, player?.id, config.rank.get)
    return ids.map((id) => byId.get(id)!)
  }, [rows, search.ids, player?.id, config])

  if (isLoading) return <PageLoader />
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />

  const set = (next: Partial<CompareSearch>) =>
    navigate({ to: '/compare', search: { ids: picks.map((p) => p.id).join(','), view: search.view, scope: search.scope, ...next }, replace: true })

  function toggle(id: string) {
    const ids = picks.map((p) => p.id)
    let next: string[]
    if (ids.includes(id)) {
      if (ids.length === 1) return
      next = ids.filter((x) => x !== id)
    } else {
      next = ids.length < MAX_PICKS ? [...ids, id] : [...ids.slice(1), id]
    }
    set({ ids: next.join(',') })
  }

  const keepers = picks.filter(isKeeper)
  const keeperMix = keepers.length > 0 && keepers.length < picks.length
  const scopeNote =
    scope === 'season'
      ? `${seasonStart().year} so far, ${data.played} Sunday${data.played === 1 ? '' : 's'} played. Recent form, which is what people argue about.`
      : scope === 'career'
        ? 'Every Sunday since the records started, almanac included.'
        : data.played
          ? `${data.played} Salami Cup${data.played === 1 ? '' : 's'} so far. Cup fixtures only, nothing from Sundays.`
          : 'No Salami Cup has been played yet, so everything here is zero for now.'
  const View = VIEW_COMPONENTS[view]
  const switchTo = (to: CompareScope, label: string) => (
    <button type="button" onClick={() => set({ scope: to })} className="text-[12.5px] font-extrabold" style={{ color: config.theme.soft }}>
      {label}
    </button>
  )
  const empty: { kind: SceneKind; title: string; body: string; action?: ReactNode } | null =
    scope === 'season' && data.played === 0
      ? { kind: 'calendar', title: 'No Sundays yet this season', body: 'The season numbers start with the first result of the year.', action: switchTo('career', 'See career numbers') }
      : scope === 'cup' && data.played === 0
        ? { kind: 'trophy', title: 'No Salami Cup played yet', body: 'Cup numbers show up here once the first cup is done.', action: switchTo('career', 'See career numbers') }
        : scope === 'cup' && picks.every((p) => p.cupsPlayed === 0)
          ? {
              kind: 'trophy',
              title:
                picks.length === 1
                  ? `${picks[0].nickname} hasn't played a cup`
                  : picks.length === 2
                    ? "Neither has played a cup"
                    : "None of these have played a cup",
              body: 'Pick someone who has been in a Salami Cup to see the cup record side by side.',
            }
          : view === 'duel' && picks.length < 2
            ? { kind: 'bench', title: 'One on the bench', body: 'Add a second player to the shortlist to start the duel.' }
            : null

  return (
    <div style={{ animation: 'cm-in 0.4s ease-out backwards' }}>
      <div className="mb-6">
        <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Compare</h1>
        <p className="max-w-[70ch] text-sm text-astro-text-muted [text-wrap:pretty]">
          Four ways to look at the same numbers. Every figure here is a counted record: goals, assists, clean sheets, ratings
          people actually voted. Never an opinion about how good someone is.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:gap-x-8">
        <div>
          <div className="astro-eyebrow mb-2">View</div>
          <div className="flex flex-wrap gap-1.5">
            {VIEWS.map(([key, label]) => (
              <Tab key={key} on={view === key} label={label} accent={config.theme.accent} onClick={() => set({ view: key })} />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="astro-eyebrow mb-2">Numbers</div>
          <div className="flex flex-wrap gap-1.5">
            {SCOPES.map(([key, label]) => (
              <Tab key={key} on={scope === key} label={label} accent={key === 'cup' ? '#f2a93b' : '#a63fff'} onClick={() => set({ scope: key })} />
            ))}
          </div>
          <div className="mt-2 text-[12px] text-astro-text-dim">{scopeNote}</div>
        </div>
      </div>

      <PickerChips rows={rows} picks={picks} theme={config.theme} onToggle={toggle} />

      {keeperMix && (
        <div className="mb-5 flex gap-3 rounded-[14px] border border-[rgba(242,169,59,0.35)] bg-[rgba(242,169,59,0.07)] px-4 py-3.5">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#f2a93b" className="mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M12 2.4 22.4 20.8H1.6Zm-1 5.6h2v7h-2Zm0 9h2v2h-2Z" />
          </svg>
          <div>
            <div className="text-[13.5px] font-extrabold text-astro-text">
              {keepers.map((p) => p.nickname).join(' and ')} {keepers.length > 1 ? 'keep goal' : 'keeps goal'}
            </div>
            <div className="text-[12.5px] text-astro-text-muted [text-wrap:pretty]">
              Goals and assists say almost nothing about a keeper, so those rows will flatter the outfielders no matter who is
              better. Read the clean sheets and the rating instead, or compare keepers against keepers.
            </div>
          </div>
        </div>
      )}

      {scope === 'cup' && (
        <div
          className="mb-5 flex items-center gap-3 overflow-hidden rounded-[16px] border-[1.5px] px-5 py-4"
          style={{ background: 'linear-gradient(100deg,#2f1a09 0%,#241a3f 52%,#111a33 100%)', borderColor: 'rgba(242,169,59,0.5)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#f2a93b" className="shrink-0" aria-hidden="true">
            <path d="M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z" />
          </svg>
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-amber">Salami Cup record</div>
            <div className="font-display text-[26px] leading-none text-astro-text">Cup nights only</div>
          </div>
        </div>
      )}

      {/* Keyed so each view replays its entrance when you switch. */}
      <div
        key={`${view}-${scope}`}
        className={scope === 'cup' ? '[&_.astro-card]:border-[rgba(242,169,59,0.28)]' : undefined}
        style={{ animation: 'cm-in 0.35s ease-out backwards' }}
      >
        {empty ? (
          <div className="astro-card">
            <NothingHere icon={<Scene kind={empty.kind} />} title={empty.title} body={empty.body} action={empty.action} />
          </div>
        ) : (
          <View picks={picks} rows={rows} config={config} onToggle={toggle} />
        )}
      </div>

      <div className="mt-5 flex gap-3 rounded-[14px] border border-border bg-astro-surface px-4 py-3.5">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#6d7496" className="mt-0.5 shrink-0">
          <path fillRule="evenodd" d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm-1 4.6h2v2h-2Zm0 3.6h2v6.4h-2Z" />
        </svg>
        <div className="text-[12.5px] text-astro-text-muted [text-wrap:pretty]">{config.footnote}</div>
      </div>
    </div>
  )
}
