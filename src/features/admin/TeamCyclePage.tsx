import { useState } from 'react'
import { toast } from 'sonner'
import { AdminConfirmDialog } from '@/components/dialogs/AdminConfirmDialog'
import { PageLoader } from '@/components/states/PageLoader'
import { StandingsTable } from '@/components/tables/StandingsTable'
import { cycleLastDay, toFinalTable } from '@/features/teams/cycles'
import { ShirtBadge } from '@/features/teams/components/ShirtBadge'
import { useCloseCycle, useCycleStandings, useTeamCycles } from '@/features/teams/hooks'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' })
const lagosDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

function addYear(iso: string) {
  const d = new Date(iso)
  d.setFullYear(d.getFullYear() + 1)
  return d
}

// A calendar year is "2027"; anything else spans years, like "2026–27". The day's grace absorbs the Lagos offset.
function cycleName(start: Date, end: Date) {
  const from = new Date(start.getTime() + 864e5).getFullYear()
  const to = new Date(end.getTime() - 864e5).getFullYear()
  return from === to ? String(from) : `${from}–${String(to).slice(2)}`
}

/** The race between the shirts: watch the table, end the cycle (on time or early), crown the champion and start the next. */
export function TeamCyclePage() {
  const { data: cycles = [], isLoading } = useTeamCycles()
  const cycle = cycles.find((c) => !c.closed_at)
  const { data: table = [], isLoading: tableLoading } = useCycleStandings(cycle)
  const close = useCloseCycle()
  const [confirming, setConfirming] = useState(false)
  const now = new Date()
  const nextStart = cycle && new Date(Math.min(now.getTime(), new Date(cycle.ends_at).getTime()))
  const [nextLabel, setNextLabel] = useState<string | null>(null)
  const [nextEnd, setNextEnd] = useState<string | null>(null)

  if (isLoading || tableLoading) return <PageLoader />
  if (!cycle) return <p className="text-astro-text-muted">No cycle is running.</p>

  const early = now < new Date(cycle.ends_at)
  const champion = table[0]
  const played = table.some((r) => r.played > 0)
  const defaultEnd = addYear(nextStart!.toISOString())
  const endsOn = nextEnd ?? lagosDate(new Date(defaultEnd.getTime() - 864e5))
  const label = nextLabel ?? cycleName(nextStart!, new Date(endsOn))
  const past = cycles.filter((c) => c.champion)

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4">
      <div>
        <h1 className="mb-1 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Team year</h1>
        <p className="text-[13px] text-astro-text-muted">The shirts race for points all cycle. When it ends you confirm the champion, which posts it to the feed and tells everyone.</p>
      </div>

      <section className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-[26px] leading-none text-astro-text">{cycle.label}</h2>
          <span className="text-[12.5px] font-bold text-astro-text-muted">
            {day(cycle.starts_at)} to {cycleLastDay(cycle.ends_at)} &middot; {early ? 'running' : 'ended, waiting for you'}
          </span>
        </div>
        <StandingsTable
          rows={table.map((r) => ({ id: r.name, name: r.name, colour: r.colour, played: r.played, won: r.wins, drawn: r.draws, lost: r.losses, goalDifference: r.goalDifference, points: r.points, mine: false }))}
        />
        <p className="mt-2 text-[11.5px] text-astro-text-dim">Level on points: goal difference, goals scored, fewest conceded, then head-to-head wins.</p>
      </section>

      <section className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
        <h2 className="mb-1 font-display text-[22px] leading-none text-astro-text">{early ? 'End the cycle early' : 'Crown the champion'}</h2>
        <p className="mb-3 text-[12.5px] text-astro-text-muted">
          {early
            ? `It's set to run until ${cycleLastDay(cycle.ends_at)}. Ending now crowns whoever is top today and starts the next cycle straight away.`
            : 'File any late results first. Then confirm the champion and set up the next cycle.'}
        </p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">
            Next cycle name
            <input value={label} onChange={(e) => setNextLabel(e.target.value)} className="mt-1 block h-10 w-full rounded-[8px] border border-white/[0.12] bg-transparent px-3 text-sm font-bold normal-case tracking-normal text-astro-text" />
          </label>
          <label className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">
            Next cycle's last day
            <input type="date" value={endsOn} min={lagosDate(nextStart!)} onChange={(e) => setNextEnd(e.target.value)} className="mt-1 block h-10 w-full rounded-[8px] border border-white/[0.12] bg-transparent px-3 text-sm font-bold text-astro-text [color-scheme:dark]" />
          </label>
        </div>
        <p className="mb-3 text-[11.5px] text-astro-text-dim">The next cycle&rsquo;s dates are locked once it starts. Only ending it early changes them.</p>
        <button
          type="button"
          disabled={!played || !label.trim() || close.isPending}
          onClick={() => setConfirming(true)}
          className="min-h-12 w-full rounded-[12px] bg-astro-cyan text-[14px] font-extrabold text-[#04121d] disabled:opacity-40"
        >
          {played ? `${early ? 'End early and crown' : 'Crown'} ${champion.name}` : 'No results filed yet'}
        </button>
        <AdminConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          eyebrow={cycle.label}
          title={`Crown ${champion?.name} champions?`}
          body={`${champion?.points} points from ${champion?.played} games. This closes ${cycle.label}, posts the final table to the feed, notifies everyone and starts ${label.trim()}. It can't be undone.`}
          confirmLabel="Crown them"
          isPending={close.isPending}
          onConfirm={() =>
            close.mutate(
              { champion: champion.name, table: toFinalTable(table), nextLabel: label.trim(), nextEndsAt: new Date(new Date(`${endsOn}T00:00:00+01:00`).getTime() + 864e5).toISOString() },
              {
                onSuccess: () => {
                  setConfirming(false)
                  setNextLabel(null)
                  setNextEnd(null)
                  toast.success(`${champion.name} crowned`)
                },
                onError: (e) => toast.error(e instanceof Error ? e.message : 'Couldn’t close the cycle.'),
              },
            )
          }
        >
          {champion && (
            <div className="my-3 flex justify-center">
              <ShirtBadge team={champion.name} label={cycle.label} size={90} />
            </div>
          )}
        </AdminConfirmDialog>
      </section>

      {past.length > 0 && (
        <section className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
          <h2 className="mb-2 font-display text-[22px] leading-none text-astro-text">Past champions</h2>
          <ul className="flex flex-col gap-1.5">
            {past.map((c) => (
              <li key={c.id} className="flex items-center gap-2.5 text-[13px] text-astro-text">
                <ShirtBadge team={c.champion!} label={c.label} size={28} />
                <span className="font-bold">{c.champion}</span>
                <span className="text-astro-text-muted">{c.label}</span>
                <span className="ml-auto text-[12px] text-astro-text-dim">closed {day(c.closed_at!)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
