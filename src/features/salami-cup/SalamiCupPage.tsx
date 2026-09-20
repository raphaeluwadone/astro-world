import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyPitchIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import {
  useCupEntrants,
  useCupHonours,
  useCupMatches,
  useCupSquads,
  useCurrentCup,
  useJoinCup,
  useLeaveCup,
} from './hooks'
import { computeCupStandings } from './standings'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

export function SalamiCupPage() {
  const { player } = useCurrentPlayer()
  const { data: cup, isLoading, isError, refetch } = useCurrentCup()
  const { data: entrants = [] } = useCupEntrants(cup?.id)
  const { data: squads = [] } = useCupSquads(cup?.id)
  const { data: matches = [] } = useCupMatches(cup?.id)
  const { data: honours = [] } = useCupHonours()
  const joinCup = useJoinCup(cup?.id)
  const leaveCup = useLeaveCup(cup?.id)

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  if (!cup) {
    return (
      <div>
        <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">THE SALAMI CUP</h1>
        <EmptyState icon={<EmptyPitchIcon />} title="No cup on the calendar yet." body="Four times a year, in Ade's name. Nothing scheduled right now." />
      </div>
    )
  }

  const myEntry = entrants.find((e) => e.player_id === player?.id)
  const entriesOpen = cup.status === 'open' && new Date() < new Date(cup.entries_close_at)
  const standings = computeCupStandings(squads, matches)

  return (
    <div>
      <div
        className="relative mb-5.5 overflow-hidden rounded-[18px] border-2 p-7"
        style={{
          background: 'linear-gradient(100deg,#2f1a09 0%,#241a3f 46%,#111a33 100%)',
          borderColor: 'rgba(242,169,59,0.5)',
        }}
      >
        <div className="mb-2.5 flex items-center gap-2.5">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#f2a93b">
            <path d="M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z" />
          </svg>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-amber">{cup.label}</div>
        </div>
        <h1 className="font-display text-[clamp(38px,7vw,58px)] leading-[0.9] text-astro-text">THE SALAMI CUP</h1>
        <p className="mt-2 max-w-[58ch] text-sm text-astro-text-muted [text-wrap:pretty]">
          Four times a year, in Ade&rsquo;s name.
        </p>

        {cup.status === 'open' && (
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div className="flex items-end gap-2.5">
              <div className="font-display text-[56px] leading-[0.8] text-astro-amber">{Math.max(0, daysUntil(cup.scheduled_at))}</div>
              <div className="pb-1.5 text-[13px] text-astro-text-muted">days to go</div>
            </div>
            {player &&
              (myEntry ? (
                <button
                  type="button"
                  disabled={leaveCup.isPending}
                  onClick={() => leaveCup.mutate(myEntry.id)}
                  className="flex items-center gap-2 rounded-full border border-[rgba(74,222,128,0.45)] bg-[rgba(74,222,128,0.14)] px-3.5 py-2 text-[12.5px] font-extrabold text-[#4ade80]"
                >
                  You&rsquo;re in &middot; tap to withdraw
                </button>
              ) : (
                entriesOpen && (
                  <button
                    type="button"
                    disabled={joinCup.isPending}
                    onClick={() => joinCup.mutate(player.id)}
                    className="rounded-full bg-astro-amber px-4 py-2.5 text-[12.5px] font-extrabold text-[#20150a]"
                  >
                    {joinCup.isPending ? 'Joining…' : "I'm in"}
                  </button>
                )
              ))}
          </div>
        )}

        {cup.status === 'live' && (
          <div className="mt-5 flex items-center gap-2.5 rounded-full border border-[rgba(224,72,63,0.55)] bg-[rgba(224,72,63,0.18)] px-3.5 py-2 w-fit">
            <div className="size-2 animate-pulse rounded-full bg-astro-red" />
            <span className="text-[12.5px] font-extrabold text-astro-red">LIVE NOW</span>
          </div>
        )}

        {cup.status === 'played' && standings.find((s) => s.played > 0) && (
          <div className="mt-5">
            <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-astro-text-dim">Winners</div>
            <div className="font-display text-[40px] leading-[0.88] text-astro-amber">
              {standings.find((s) => s.played > 0)!.name.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      <div className="mb-5.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: 'When', v: formatDateTime(cup.scheduled_at) },
          { k: 'Where', v: cup.venue ?? 'TBC' },
          { k: 'Entries close', v: formatDateTime(cup.entries_close_at) },
          { k: 'Withdraw by', v: formatDateTime(cup.withdrawal_deadline) },
        ].map((f) => (
          <div key={f.k} className="astro-card px-4 py-3.5">
            <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">{f.k}</div>
            <div className="text-[13.5px] font-bold text-astro-text [text-wrap:pretty]">{f.v}</div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          {squads.length > 0 ? (
            <div className="astro-card p-6">
              <div className="font-display mb-4.5 text-[28px] leading-none text-astro-text">SQUADS</div>
              <div className="flex flex-col gap-3">
                {squads.map((s) => (
                  <div key={s.id} className="rounded-[13px] bg-astro-surface-2 p-4">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="size-2.5 shrink-0 rounded-sm" style={{ background: s.colour }} />
                      <div className="font-display text-2xl leading-none text-astro-text">{s.name}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.members.map((m) => (
                        <div key={m.id} className="rounded-md border border-white/[0.07] bg-astro-surface px-2.5 py-1 text-[11.5px] font-bold text-astro-text-muted">
                          {m.nickname}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="astro-card p-6">
              <div className="font-display mb-1.5 text-[28px] leading-none text-astro-text">ENTRANTS</div>
              <p className="mb-4 text-[13px] text-astro-text-muted">
                {entrants.length} in so far. Squads are drawn once entries close.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entrants.map((e) => (
                  <div key={e.id} className="rounded-md border border-white/[0.07] bg-astro-surface-2 px-2.5 py-1 text-[11.5px] font-bold text-astro-text-muted">
                    {e.players.nickname}
                  </div>
                ))}
              </div>
            </div>
          )}

          {matches.length > 0 && (
            <div className="astro-card p-6">
              <div className="font-display mb-4.5 text-[28px] leading-none text-astro-text">FIXTURES</div>
              <div className="flex flex-col gap-2">
                {matches.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-[11px] bg-astro-surface-2 px-4 py-3">
                    <div className="min-w-0 flex-1 text-right text-[13px] font-bold text-astro-text">{m.squad_a_name}</div>
                    <div className="font-display shrink-0 text-2xl text-astro-text">
                      {m.score_a != null && m.score_b != null ? `${m.score_a}–${m.score_b}` : 'v'}
                    </div>
                    <div className="min-w-0 flex-1 text-[13px] font-bold text-astro-text">{m.squad_b_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {standings.length > 0 && (
            <div className="astro-card overflow-x-auto p-0">
              <div className="font-display px-6 pt-6 text-[28px] leading-none text-astro-text">TABLE</div>
              <div className="grid min-w-[420px] grid-cols-[minmax(120px,1fr)_repeat(5,40px)_48px] gap-2 px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">
                <div>Squad</div>
                <div className="text-center">P</div>
                <div className="text-center">W</div>
                <div className="text-center">D</div>
                <div className="text-center">L</div>
                <div className="text-center">GD</div>
                <div className="text-right">Pts</div>
              </div>
              {standings.map((s) => (
                <div key={s.squadId} className="grid min-w-[420px] grid-cols-[minmax(120px,1fr)_repeat(5,40px)_48px] items-center gap-2 border-t border-white/[0.05] px-6 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="size-2 shrink-0 rounded-sm" style={{ background: s.colour }} />
                    <div className="truncate text-[13.5px] font-bold text-astro-text">{s.name}</div>
                  </div>
                  <div className="text-center text-xs text-astro-text-muted">{s.played}</div>
                  <div className="text-center text-xs text-astro-text-muted">{s.won}</div>
                  <div className="text-center text-xs text-astro-text-muted">{s.drawn}</div>
                  <div className="text-center text-xs text-astro-text-muted">{s.lost}</div>
                  <div className="text-center text-xs text-astro-text-muted">{s.goalDifference}</div>
                  <div className="font-display text-right text-lg text-astro-amber">{s.points}</div>
                </div>
              ))}
              <div className="h-3" />
            </div>
          )}

          <div className="astro-card p-6">
            <div className="font-display mb-4 text-[28px] leading-none text-astro-text">HONOURS</div>
            {honours.length === 0 ? (
              <p className="text-[13px] text-astro-text-muted">No cup has been completed yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {honours.map((h) => (
                  <div key={h.quarter.id} className="rounded-[11px] bg-astro-surface-2 px-3.5 py-3.5">
                    <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">{h.quarter.label}</div>
                    <div className="font-display text-[20px] leading-none" style={{ color: h.winnerColour ?? '#eef0f9' }}>
                      {h.winnerName ?? 'No result recorded'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
