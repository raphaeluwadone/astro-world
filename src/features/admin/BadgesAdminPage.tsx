import { confirmAction, withConfirm } from '@/components/dialogs/confirm'
import { BadgeHoverCard } from '@/features/badges/components/BadgeHoverCard'
import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AstroSelect } from '@/components/ui/astro-select'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { pendingBadges, type BadgeRow } from '@/features/badges/api'
import { BadgeIcon } from '@/features/badges/BadgeIcon'
import { badgeDef, MANUAL_BADGES, TIER_COLOR, TIER_LABEL } from '@/features/badges/definitions'
import { useAwardBadges, useAwardManualBadge, useBadgeRows, useDecideBadge } from '@/features/badges/hooks'
import { useCupQuarters } from '@/features/honours/hooks'
import { useAllPlayers } from '@/features/kitty/hooks'

const DAY_MS = 24 * 60 * 60 * 1000

function goesLiveIn(r: BadgeRow) {
  const days = Math.ceil((new Date(r.auto_live_at).getTime() - Date.now()) / DAY_MS)
  return days <= 1 ? 'Goes live on its own tomorrow' : `Goes live on its own in ${days} days`
}

/** One award can go to several players when they tie, so pending rows are grouped by award. */
function groupByAward(rows: BadgeRow[]) {
  const groups = new Map<string, BadgeRow[]>()
  for (const r of rows) {
    const k = `${r.badge_key}|${r.period_key}`
    groups.set(k, [...(groups.get(k) ?? []), r])
  }
  return [...groups.values()]
}

function AwardGroup({ rows, deciderId, held }: { rows: BadgeRow[]; deciderId: string | null; held?: boolean }) {
  const decide = useDecideBadge(deciderId)
  const first = rows[0]
  const def = badgeDef(first.badge_key, first.title)
  const color = TIER_COLOR[def.tier]

  async function run(status: 'live' | 'held', label: string) {
    const ok = await confirmAction(
      status === 'live'
        ? { tone: 'admin', eyebrow: 'Badges', title: `Make ${def.name} live?`, body: `It goes on ${rows.length === 1 ? 'their card' : `${rows.length} cards`} and into the honours feed, and they’re told.`, confirmLabel: 'Make it live' }
        : { tone: 'admin', eyebrow: 'Badges', title: `Hold back ${def.name}?`, body: 'Nobody sees it until you make it live.', confirmLabel: 'Hold it back' },
    )
    if (!ok) return
    Promise.all(rows.map((r) => decide.mutateAsync({ id: r.id, status })))
      .then(() => toast.success(label))
      .catch(() => toast.error("Couldn't update that badge."))
  }

  return (
    <div className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
      <div className="flex flex-wrap items-start gap-3.5">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-dashed"
          style={{ borderColor: color, color: def.tier === 'cup' ? '#f7c25e' : color }}
        >
          <BadgeIcon name={def.icon} className="size-5" />
        </span>
        <div className="min-w-0 flex-[1_1_220px]">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: def.tier === 'cup' ? '#f7c25e' : color }}>
            {TIER_LABEL[def.tier]}
            {rows.length > 1 ? ` · ${rows.length}-way tie` : ''}
          </div>
          <BadgeHoverCard awardKey={first.badge_key} triggerClassName="inline-block rounded font-display text-2xl leading-none text-astro-text cursor-pointer hover:underline">
            {def.name}
          </BadgeHoverCard>
          <div className="mt-1 text-[13px] text-astro-text-muted">
            {rows.map((r, i) => (
              <span key={r.id}>
                {i > 0 && ', '}
                <Link to="/players/$playerId" params={{ playerId: r.player_id }} className="font-bold text-astro-text hover:underline">
                  {r.nickname}
                </Link>
              </span>
            ))}
            {first.stat ? ` · ${first.stat}` : ''}
          </div>
          {first.detail && <div className="text-xs text-astro-text-dim">{first.detail}</div>}
          <div className="mt-1 text-xs font-bold text-astro-amber">{held ? 'Held back, not showing' : goesLiveIn(first)}</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={decide.isPending} onClick={() => run('live', `${def.name} is live`)}>
            {held ? 'Release' : 'Confirm now'}
          </Button>
          {!held && (
            <Button size="sm" variant="secondary" disabled={decide.isPending} onClick={() => run('held', `${def.name} held back`)}>
              Hold back
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ManualAward({ deciderId }: { deciderId: string | null }) {
  const { data: players = [] } = useAllPlayers()
  const award = useAwardManualBadge(deciderId)
  const [badgeKey, setBadgeKey] = useState(MANUAL_BADGES[0]?.key ?? '')
  const [playerId, setPlayerId] = useState('')
  const [detail, setDetail] = useState('')
  const { data: quarters } = useCupQuarters()
  const playedCups = [...(quarters?.values() ?? [])]
    .filter((q) => new Date(q.scheduled_at).getTime() <= Date.now())
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
  const [cupId, setCupId] = useState('')
  const isCup = MANUAL_BADGES.find((b) => b.key === badgeKey)?.tier === 'cup'
  const cup = playedCups.find((q) => q.id === cupId) ?? playedCups[0]
  const year = new Date().getFullYear()

  async function submit() {
    if (!playerId || (isCup && !cup)) return
    const ok = await confirmAction({ tone: 'admin', eyebrow: 'Badges', title: 'Award this badge?', body: 'It goes on their card and into the honours feed, and they’re told.', confirmLabel: 'Award it' })
    if (!ok) return
    award.mutate(
      { playerId, badgeKey, period: isCup ? { key: cup!.id, at: cup!.scheduled_at } : { key: String(year) }, detail: detail.trim() },
      {
        onSuccess: () => {
          toast.success('Badge awarded')
          setPlayerId('')
          setDetail('')
        },
        onError: () => toast.error(isCup ? 'They may already have this badge for that cup.' : 'They may already have this badge for this year.'),
      },
    )
  }

  return (
    <div className="astro-card max-w-2xl p-6">
      <div className="mb-1 font-display text-2xl leading-none text-astro-text">Award by hand</div>
      <p className="mb-4 text-[13px] text-astro-text-muted">
        For badges the results can&rsquo;t decide. These go live straight away.
      </p>
      <div className="flex flex-wrap gap-2.5">
        <AstroSelect
          aria-label="Badge"
          value={badgeKey}
          onValueChange={setBadgeKey}
          options={MANUAL_BADGES.map((b) => ({ value: b.key, label: b.name }))}
          className="min-w-[200px]"
        />
        <AstroSelect
          aria-label="Player"
          value={playerId}
          onValueChange={setPlayerId}
          placeholder="Pick a player"
          options={players.map((p) => ({ value: p.id, label: p.nickname }))}
          className="min-w-[200px]"
        />
        {isCup && (
          <AstroSelect
            aria-label="Cup"
            value={cup?.id ?? ''}
            onValueChange={setCupId}
            placeholder="No cup played yet"
            options={playedCups.map((q) => ({ value: q.id, label: `${q.label} Salami Cup` }))}
            className="min-w-[180px]"
          />
        )}
      </div>
      <input
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="Why, in a line (shown on hover)"
        className="mt-2.5 h-10 w-full rounded-[10px] border border-white/[0.09] bg-astro-surface-2 px-3 text-sm text-astro-text placeholder:text-astro-text-dim focus:outline-none focus-visible:border-astro-accent/60"
      />
      <Button className="mt-3" disabled={!playerId || (isCup && !cup) || award.isPending} onClick={submit}>
        {award.isPending ? 'Awarding…' : 'Award badge'}
      </Button>
    </div>
  )
}

export function BadgesAdminPage() {
  const { player } = useCurrentPlayer()
  const { data: rows = [], isLoading, isError, refetch } = useBadgeRows()
  const runAward = useAwardBadges()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(String(thisYear - 1))

  // Weekly, monthly, cup and milestone badges are safe to work out on every visit.
  useEffect(() => {
    runAward.mutate(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pending = useMemo(() => groupByAward(pendingBadges(rows)), [rows])
  const held = useMemo(() => groupByAward(rows.filter((r) => r.status === 'held')), [rows])
  const yearAwarded = rows.some((r) => r.period_key === year && badgeDef(r.badge_key, r.title).tier === 'year' && !badgeDef(r.badge_key, r.title).manual)

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">Weekly, monthly, yearly</div>
      <h1 className="mb-2 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Badges</h1>
      <p className="mb-6 max-w-[62ch] text-sm text-astro-text-muted">
        Weekly and monthly badges go live by themselves. Yearly and cup badges wait here for a week: confirm them now, hold them back, or let
        them go live on their own.
      </p>

      <div className="flex flex-col gap-5">
        <section>
          <div className="mb-2.5 flex items-baseline gap-3">
            <h2 className="font-display text-[28px] leading-none text-astro-text">Waiting to go live</h2>
            <span className="text-xs text-astro-text-dim">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-astro-text-dim">Nothing waiting.</p>
          ) : (
            <div className="flex max-w-3xl flex-col gap-2.5">
              {pending.map((g) => (
                <AwardGroup key={g[0].id} rows={g} deciderId={player?.id ?? null} />
              ))}
            </div>
          )}
        </section>

        {held.length > 0 && (
          <section>
            <h2 className="mb-2.5 font-display text-[28px] leading-none text-astro-text">Held back</h2>
            <div className="flex max-w-3xl flex-col gap-2.5">
              {held.map((g) => (
                <AwardGroup key={g[0].id} rows={g} deciderId={player?.id ?? null} held />
              ))}
            </div>
          </section>
        )}

        <div className="astro-card max-w-2xl p-6">
          <div className="mb-1 font-display text-2xl leading-none text-astro-text">Yearly titles</div>
          <p className="mb-4 text-[13px] text-astro-text-muted">
            Works out a finished year&rsquo;s top scorer, assists, clean sheets and the rest from recorded results.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <AstroSelect
              aria-label="Season"
              value={year}
              onValueChange={setYear}
              options={[thisYear - 1, thisYear - 2, thisYear - 3].map((y) => ({ value: String(y), label: String(y) }))}
              className="w-[120px]"
            />
            <Button
              disabled={runAward.isPending}
              onClick={() =>
                withConfirm({ tone: 'admin', eyebrow: 'Badges', title: `Award ${year} titles?`, body: `Works out the ${year} season titles from the stats and adds them for you to review.`, confirmLabel: 'Work them out' }, () => runAward.mutate(Number(year), {
                  onSuccess: (n) => toast.success(n ? `${n} badge${n === 1 ? '' : 's'} added` : 'Nothing new to award'),
                  onError: () => toast.error("Couldn't work out the badges."),
                }))
              }
            >
              {runAward.isPending ? 'Working it out…' : yearAwarded ? `Check ${year} again` : `Award ${year} titles`}
            </Button>
          </div>
          <p className="mt-2 text-xs text-astro-text-dim">
            {thisYear} can be awarded once it&rsquo;s over. Once a yearly title is live it can&rsquo;t be changed or removed for its year.
          </p>
        </div>

        <ManualAward deciderId={player?.id ?? null} />
      </div>
    </div>
  )
}
