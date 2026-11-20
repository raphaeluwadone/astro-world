import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import type { CompareRow } from '../api'
import { keeps, type ViewProps } from '../metrics'

function Side({ player, colour, align }: { player: CompareRow; colour: string; align: 'left' | 'right' }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <PlayerPhoto
        playerId={player.id}
        alt=""
        className="size-12 shrink-0 rounded-full border-2 md:size-14"
        style={{ borderColor: colour, background: '#182448' }}
      />
      <div className="min-w-0">
        <div className="font-display truncate text-[30px] leading-none md:text-[38px]" style={{ color: colour }}>
          {player.nickname}
        </div>
        <div className="truncate text-[12px] text-astro-text-muted">{player.full_name}</div>
        <div className="text-[10.5px] font-extrabold tracking-[0.12em] text-astro-text-dim">{player.positions.join(' / ') || '—'}</div>
      </div>
    </div>
  )
}

export function DuelView({ picks, config }: ViewProps) {
  const a = picks[0]
  const b = picks[1]
  if (!a) return null
  if (!b) {
    return <div className="astro-card px-6 py-10 text-center text-sm text-astro-text-muted">Add a second player to the shortlist.</div>
  }
  const [lc, rc] = config.theme.colours
  const rows = config.rows.filter((m) => !m.keepersOnly || keeps(a) || keeps(b))

  return (
    <div className="astro-card p-4 md:p-6">
      <div className="mb-4 text-[12.5px] text-astro-text-muted">
        {picks.length > 2
          ? `The duel takes the first two on your shortlist, ${a.nickname} and ${b.nickname}.`
          : 'Two players, one line down the middle.'}
      </div>
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <Side player={a} colour={lc} align="left" />
        <div className="font-display text-2xl text-astro-text-dim">VS</div>
        <Side player={b} colour={rc} align="right" />
      </div>

      <div className="flex flex-col gap-3.5">
        {rows.map((m, n) => {
          const lv = m.get(a)
          const rv = m.get(b)
          const max = Math.max(lv ?? 0, rv ?? 0) || 1
          const lWin = !m.neutral && lv !== null && (rv === null || lv > rv)
          const rWin = !m.neutral && rv !== null && (lv === null || rv > lv)
          const show = (v: number | null) => (v === null ? '—' : m.fmt ? m.fmt(v) : v)
          const bar = (v: number | null, colour: string, win: boolean, origin: string) => ({
            width: `${((v ?? 0) / max) * 100}%`,
            background: m.neutral ? '#3c4570' : win ? colour : `${colour}4d`,
            transformOrigin: origin,
            animation: `cm-bar 0.7s cubic-bezier(.2,.8,.2,1) ${n * 0.05}s backwards`,
          })
          return (
            <div key={m.label}>
              <div className="mb-1 text-center text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">{m.label}</div>
              <div className="grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)_52px] items-center gap-2">
                <div className="font-display text-[22px] leading-none" style={{ color: lWin ? '#eef0f9' : '#9aa3c4' }}>
                  {show(lv)}
                </div>
                <div className="flex h-2.5 justify-end overflow-hidden rounded-full bg-[#182448]">
                  <div className="h-full rounded-full" style={bar(lv, lc, lWin, 'right')} />
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-[#182448]">
                  <div className="h-full rounded-full" style={bar(rv, rc, rWin, 'left')} />
                </div>
                <div className="font-display text-right text-[22px] leading-none" style={{ color: rWin ? '#eef0f9' : '#9aa3c4' }}>
                  {show(rv)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="mt-6 rounded-[14px] border px-5 py-4"
        style={{ borderColor: `rgba(${config.theme.rgb},0.3)`, background: `rgba(${config.theme.rgb},0.07)` }}
      >
        <div className="astro-eyebrow mb-1.5" style={{ color: config.theme.soft }}>
          The verdict
        </div>
        <div className="text-[14.5px] font-semibold text-astro-text [text-wrap:pretty]">{config.verdict(a, b)}</div>
      </div>
    </div>
  )
}
