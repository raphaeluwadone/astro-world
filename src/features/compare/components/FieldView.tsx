import type { CSSProperties } from 'react'
import { niceTicks, type ViewProps } from '../metrics'

const W = 720
const H = 440
const X0 = 56
const X1 = 700
const Y0 = 392
const Y1 = 20

// Ticks and labels are HTML laid over the SVG so they stay readable when the chart shrinks on a phone.
const at = (x: number, y: number, extra: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left: `${(x / W) * 100}%`,
  top: `${(y / H) * 100}%`,
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  ...extra,
})

export function FieldView({ picks, rows, config, onToggle }: ViewProps) {
  const { scatter } = config
  const xTicks = niceTicks(Math.max(1, ...rows.map(scatter.x)))
  const yTicks = niceTicks(Math.max(1, ...rows.map(scatter.y)))
  const maxX = xTicks[4]
  const maxY = yTicks[4]
  const sx = (v: number) => X0 + (v / maxX) * (X1 - X0)
  const sy = (v: number) => Y0 - (v / maxY) * (Y0 - Y1)
  const pickedIds = new Set(picks.map((p) => p.id))
  const rest = rows.filter((p) => !pickedIds.has(p.id))

  const rates = scatter.rates.map((r) => {
    const yAtMaxX = r * maxX
    const endX = yAtMaxX <= maxY ? maxX : maxY / r
    return { r, x: sx(endX), y: sy(Math.min(yAtMaxX, maxY)) }
  })

  // Picks with identical numbers share a spot, so their dots fan out and their names stack.
  const spot = (p: (typeof picks)[number]) => `${scatter.x(p)}:${scatter.y(p)}`
  const placed = picks.map((p, k) => {
    const same = picks.filter((q) => spot(q) === spot(p))
    const i = same.indexOf(p)
    const shift = i - (same.length - 1) / 2
    return { p, k, cx: sx(scatter.x(p)) + shift * 9, cy: sy(scatter.y(p)), shift }
  })

  const qualified = rows.filter((p) => config.games(p) >= config.minGames)
  const bestPicked = Math.max(...picks.map(config.rank.get))
  const ahead = qualified.filter((p) => !pickedIds.has(p.id) && config.rank.get(p) > bestPicked).length
  const read =
    ahead === 0
      ? "Nobody in the group returns more than your shortlist's best."
      : `${ahead} ${ahead === 1 ? 'player is' : 'players are'} ahead of everyone you've picked, which is exactly what a two-player comparison hides.`

  return (
    <div className="astro-card p-4 md:p-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-[12.5px] text-astro-text-muted">{scatter.note}</div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">{rest.length} others</div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`${scatter.xLabel} against ${scatter.yLabel}`}>
          <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="rgba(255,255,255,0.14)" />
          <line x1={X0} y1={Y1} x2={X0} y2={Y0} stroke="rgba(255,255,255,0.14)" />
          {yTicks.map((v) => (
            <line key={`y${v}`} x1={X0} y1={sy(v)} x2={X1} y2={sy(v)} stroke="rgba(255,255,255,0.05)" />
          ))}
          {xTicks.map((v) => (
            <line key={`x${v}`} x1={sx(v)} y1={Y0} x2={sx(v)} y2={Y0 - 6} stroke="rgba(255,255,255,0.22)" />
          ))}
          {rates.map((r) => (
            <line key={r.r} x1={X0} y1={Y0} x2={r.x} y2={r.y} stroke={`rgba(${config.theme.rgb},0.3)`} strokeDasharray="4 5" />
          ))}
          {rest.map((p) => (
            <circle
              key={p.id}
              cx={sx(scatter.x(p))}
              cy={sy(scatter.y(p))}
              r={6}
              fill="#3c4570"
              stroke="#111a33"
              strokeWidth={2}
              className="cursor-pointer hover:fill-[#5a6699]"
              onClick={() => onToggle(p.id)}
            >
              <title>{p.nickname}</title>
            </circle>
          ))}
          {placed.map(({ p, k, cx, cy }) => (
            <g key={p.id} className="cursor-pointer" onClick={() => onToggle(p.id)}>
              <circle cx={cx} cy={cy} r={15} fill={`${config.theme.colours[k]}33`} />
              <circle cx={cx} cy={cy} r={7.5} fill={config.theme.colours[k]} stroke="#0a0f1f" strokeWidth={2} />
            </g>
          ))}
        </svg>

        {yTicks.map((v) => (
          <div key={`ty${v}`} style={at(X0 - 10, sy(v), { transform: 'translate(-100%,-50%)' })} className="text-[11px] font-bold text-astro-text-muted">
            {v}
          </div>
        ))}
        {xTicks.map((v) => (
          <div key={`tx${v}`} style={at(sx(v), Y0 + 8, { transform: 'translate(-50%,0)' })} className="text-[11px] font-bold text-astro-text-muted">
            {v}
          </div>
        ))}
        {rates.map((r) => (
          <div key={`r${r.r}`} style={at(r.x, r.y, { transform: 'translate(-100%,4px)', color: config.theme.soft })} className="text-[10.5px] font-extrabold">
            {r.r.toFixed(1)} {scatter.rateLabel}
          </div>
        ))}
        {placed.map(({ p, k, cx, cy, shift }) => {
          const right = cx < X1 - 110
          return (
            <div
              key={`l${p.id}`}
              style={at(cx, cy, { transform: `translate(${right ? '16px' : 'calc(-100% - 16px)'}, calc(-50% + ${shift * 22}px))`, color: config.theme.colours[k] })}
              className="font-display text-[19px] leading-none"
            >
              {p.nickname}
            </div>
          )
        })}
        <div style={at((X0 + X1) / 2, H - 16, { transform: 'translate(-50%,0)' })} className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-astro-text-muted">
          {scatter.xLabel}
        </div>
        <div
          style={at(8, (Y0 + Y1) / 2, { transform: 'translate(-50%,-50%) rotate(-90deg)' })}
          className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-astro-text-muted"
        >
          {scatter.yLabel}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {picks.map((p, k) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="size-2.5 rounded-full" style={{ background: config.theme.colours[k] }} />
            <div className="text-[13px] font-extrabold text-astro-text">{p.nickname}</div>
            <div className="text-[12px] text-astro-text-muted">{config.summary(p)}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[12px] bg-astro-surface-2 px-4 py-3 text-[13px] text-astro-text-muted">{read}</div>
    </div>
  )
}
