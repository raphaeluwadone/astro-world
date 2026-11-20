import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import { winners, type ViewProps } from '../metrics'
import { LeagueList } from './LeagueList'

export function ShortlistView({ picks, rows, config, onToggle }: ViewProps) {
  const cols = `minmax(120px,1.1fr) repeat(${picks.length}, minmax(76px,1fr))`

  return (
    <div className="flex flex-col gap-5">
      <div className="astro-card overflow-x-auto">
        <div style={{ minWidth: 170 + picks.length * 96 }}>
          <div className="grid items-end gap-2 border-b border-border px-4 py-4 md:px-5" style={{ gridTemplateColumns: cols }}>
            <div />
            {picks.map((p, k) => (
              <div key={p.id} className="flex min-w-0 flex-col items-center text-center">
                <PlayerPhoto
                  playerId={p.id}
                  alt=""
                  className="mb-1.5 size-10 rounded-full border-2"
                  style={{ borderColor: config.theme.colours[k], background: '#182448' }}
                />
                <div className="font-display w-full truncate text-xl leading-none" style={{ color: config.theme.colours[k] }}>
                  {p.nickname}
                </div>
                <div className="text-[10px] font-extrabold tracking-[0.1em] text-astro-text-dim">{p.positions.join(' / ') || '—'}</div>
              </div>
            ))}
          </div>
          {config.rows.map((m) => {
            const values = picks.map(m.get)
            const won = m.neutral ? new Set<number>() : winners(values)
            return (
              <div key={m.label} className="grid items-center gap-2 border-t border-border px-4 py-3 first:border-t-0 md:px-5" style={{ gridTemplateColumns: cols }}>
                <div className="min-w-0">
                  <div className="text-[13px] font-extrabold text-astro-text">{m.label}</div>
                  <div className="text-[11px] text-astro-text-dim">{m.note}</div>
                </div>
                {values.map((v, k) => (
                  <div key={picks[k].id} className="text-center">
                    <span
                      className="font-display inline-block min-w-[54px] rounded-[9px] px-[11px] py-1.5 text-[22px] leading-none"
                      style={
                        won.has(k)
                          ? { background: config.theme.colours[k], color: '#0a0f1f' }
                          : { background: '#182448', color: v === null ? '#4d5578' : '#eef0f9' }
                      }
                    >
                      {v === null ? '—' : m.fmt ? m.fmt(v) : v}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <LeagueList picks={picks} rows={rows} config={config} onToggle={onToggle} />
    </div>
  )
}
