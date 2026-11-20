import { axisMaxima, type ViewProps } from '../metrics'

const CX = 200
const CY = 190
const RAD = 140
const ANG = [0, 1, 2, 3, 4, 5].map((n) => ((-90 + n * 60) * Math.PI) / 180)
const LABELS: Array<{ x: number; y: number; anchor: 'middle' | 'start' | 'end' }> = [
  { x: 200, y: 34, anchor: 'middle' },
  { x: 336, y: 114, anchor: 'start' },
  { x: 336, y: 266, anchor: 'start' },
  { x: 200, y: 352, anchor: 'middle' },
  { x: 64, y: 262, anchor: 'end' },
  { x: 64, y: 114, anchor: 'end' },
]

const point = (n: number, r: number) => [CX + r * Math.cos(ANG[n]), CY + r * Math.sin(ANG[n])] as const
const ring = (r: number) => ANG.map((_, n) => point(n, r).map((v) => v.toFixed(1)).join(' ')).join(' ')

export function HexagonView({ picks, rows, config }: ViewProps) {
  const maxima = axisMaxima(config, rows)
  const shapes = picks.map((p, k) => {
    const pts = config.axes.map((a, n) => {
      const v = Math.max(0, Math.min(1, a.get(p) / maxima[n]))
      return point(n, 6 + v * (RAD - 6))
    })
    return { id: p.id, colour: config.theme.colours[k], pts }
  })

  return (
    <div className="astro-card grid gap-6 p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:p-6">
      <svg viewBox="-40 20 480 350" className="w-full" role="img" aria-label="Hexagon comparison">
        {[1, 0.75, 0.5, 0.25].map((f) => (
          <polygon key={f} points={ring(RAD * f)} fill="none" stroke={f === 1 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'} />
        ))}
        {ANG.map((_, n) => {
          const [x, y] = point(n, RAD)
          return <line key={n} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.09)" />
        })}
        <g style={{ transformOrigin: `${CX}px ${CY}px`, animation: 'cm-poly 0.6s cubic-bezier(.2,.8,.2,1) backwards' }}>
          {shapes.map((s) => (
            <polygon
              key={s.id}
              points={s.pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')}
              fill={`${s.colour}14`}
              stroke={s.colour}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          ))}
          {shapes.flatMap((s) =>
            s.pts.map(([x, y], n) => (
              <line key={`${s.id}-l${n}`} x1={CX} y1={CY} x2={x} y2={y} stroke={s.colour} strokeWidth={1.5} strokeOpacity={0.6} />
            )),
          )}
          {shapes.flatMap((s) =>
            s.pts.map(([x, y], n) => <circle key={`${s.id}-c${n}`} cx={x} cy={y} r={4.5} fill={s.colour} stroke="#111a33" strokeWidth={1.5} />),
          )}
          <circle cx={CX} cy={CY} r={3} fill="#4d5578" />
        </g>
        {config.axes.map((a, n) => {
          const l = LABELS[n]
          const words = n === 4 ? a.label.toUpperCase().split(' ') : [a.label.toUpperCase()]
          return (
            <text key={a.label} x={l.x} y={l.y} textAnchor={l.anchor} fill="#9aa3c4" fontFamily="Manrope, sans-serif" fontSize={11} fontWeight={800}>
              {words.map((w, i) => (
                <tspan key={w} x={l.x} dy={i ? 13 : 0}>
                  {w}
                </tspan>
              ))}
            </text>
          )
        })}
      </svg>

      <div className="min-w-0">
        <div className="astro-eyebrow mb-3">On the shape</div>
        <div className="mb-5 flex flex-col gap-2.5">
          {picks.map((p, k) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="h-1 w-6 shrink-0 rounded-full" style={{ background: config.theme.colours[k] }} />
              <div className="min-w-0">
                <div className="font-display text-xl leading-none text-astro-text">{p.nickname}</div>
                <div className="text-[12px] text-astro-text-muted">{config.summary(p)}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] leading-relaxed text-astro-text-muted [text-wrap:pretty]">
          One outline per player, with a dot where they sit on each spoke. Every spoke is scaled against{' '}
          <strong className="text-astro-text">the best in the group</strong>, not out of ten, so reaching the outer ring means
          nobody does more of it. All six are counted records:{' '}
          {config.axes.map((a) => a.label.toLowerCase()).join(', ')}.
        </p>
      </div>
    </div>
  )
}
