import { usePublicRosterSize } from '@/features/auth/hooks'
import { AMENDMENTS, LAST_AMENDED, PUNISHMENTS, RULE_GLANCE_STATIC, RULE_SECTIONS } from './content'

const SEVERITY_STYLE: Record<string, string> = {
  Light: 'bg-astro-cyan/15 border border-astro-cyan/45 text-astro-cyan',
  Heavy: 'bg-astro-amber/15 border border-astro-amber/45 text-astro-amber',
  Severe: 'bg-astro-red/15 border border-astro-red/45 text-astro-red',
}

export function RulesPage() {
  const { data: rosterSize } = usePublicRosterSize()

  const glance = [{ k: 'Group', v: rosterSize != null ? String(rosterSize) : '—' }, ...RULE_GLANCE_STATIC]

  return (
    <div>
      <div className="mb-6 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
        Last amended {LAST_AMENDED}
      </div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">THE RULES</h1>
      <p className="mb-6 max-w-[62ch] text-sm text-astro-text-muted [text-wrap:pretty]">
        Everything the group has actually agreed to. If it isn't written here, it isn't a rule, it's someone's
        opinion.
      </p>

      <div className="mb-5.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {glance.map((g) => (
          <div key={g.k} className="astro-card px-4 py-3.5">
            <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
              {g.k}
            </div>
            <div className="font-display text-[28px] leading-[0.95] text-astro-text">{g.v}</div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="flex min-w-0 flex-col gap-3.5">
          {RULE_SECTIONS.map((sec) => (
            <div key={sec.n} className="astro-card p-6">
              <div className="mb-4.5 flex items-center gap-3.5">
                <div
                  className="bg-astro-surface-2 font-display shrink-0 rounded-[9px] px-2.5 py-1.5 text-[22px] leading-none text-astro-text-dim"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)' }}
                >
                  {sec.n}
                </div>
                <div className="font-display text-[28px] leading-none text-astro-text">{sec.title}</div>
              </div>
              <div className="flex flex-col gap-3">
                {sec.items.map((r) => (
                  <div key={r.k} className="flex items-start gap-3.5">
                    <div className="w-8.5 shrink-0 pt-0.5 text-xs font-extrabold text-astro-accent">{r.k}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] leading-[1.6] text-astro-text [text-wrap:pretty]">{r.text}</div>
                      {r.tag && (
                        <div
                          className={
                            'mt-2 inline-block rounded-md border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ' +
                            (r.tagTone === 'pending'
                              ? 'border-astro-amber/40 bg-astro-amber/15 text-astro-amber'
                              : 'border-astro-accent/40 bg-astro-accent/15 text-astro-accent-soft')
                          }
                        >
                          {r.tag}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="astro-card border-[1.5px] border-astro-accent/40 p-6">
            <div className="font-display mb-1.5 text-[28px] leading-none text-astro-text">AMENDMENTS</div>
            <p className="mb-5 text-[13px] text-astro-text-muted [text-wrap:pretty]">
              Every change to the rules, newest first, who made it and how it was decided.
            </p>
            <div className="flex flex-col gap-0.5">
              {AMENDMENTS.map((a, i) => (
                <div key={a.date} className="flex gap-3.5">
                  <div className="flex w-3 shrink-0 flex-col items-center">
                    <div className="mt-1.5 size-2.5 shrink-0 rounded-sm bg-astro-accent" />
                    {i < AMENDMENTS.length - 1 && <div className="w-px flex-1 bg-white/[0.09]" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-5">
                    <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">
                      {a.date}
                    </div>
                    <div className="mb-2 text-[13.5px] leading-[1.55] text-astro-text [text-wrap:pretty]">{a.text}</div>
                    <div className="flex flex-wrap gap-1.5">
                      <div className="rounded-md border border-white/[0.07] bg-astro-surface-2 px-2.5 py-1 text-[11px] font-bold text-astro-text-muted">
                        {a.by}
                      </div>
                      <div className="rounded-md border border-white/[0.07] bg-astro-surface-2 px-2.5 py-1 text-[11px] font-extrabold text-astro-text-dim">
                        {a.vote}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="astro-card border-astro-amber/35 p-6">
            <div className="mb-1.5 flex items-center gap-2.5">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#f2a93b">
                <path d="M4.6 3.4h14.8v4.2H4.6ZM6.8 9.6h10.4V20.6H6.8Zm2.6 3.2v4.8h5.2v-4.8Z" />
              </svg>
              <div className="font-display text-[28px] leading-none text-astro-text">PUNISHMENTS</div>
            </div>
            <p className="mb-4.5 text-[13px] text-astro-text-muted [text-wrap:pretty]">
              What actually happens, and what it costs you. An admin can go lighter than this with a reason, never
              heavier.
            </p>
            <div className="flex flex-col gap-2.5">
              {PUNISHMENTS.map((p) => (
                <div key={p.name} className="rounded-[11px] bg-astro-surface-2 px-3.5 py-3.5">
                  <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 text-[13.5px] font-extrabold text-astro-text">{p.name}</div>
                    <div className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] ${SEVERITY_STYLE[p.severity]}`}>
                      {p.severity}
                    </div>
                  </div>
                  <p className="mb-2.5 text-[12.5px] leading-[1.5] text-astro-text-muted [text-wrap:pretty]">{p.detail}</p>
                  <div className="inline-block rounded-md border border-white/[0.07] bg-astro-surface px-2.5 py-1.5 text-[11.5px] font-extrabold text-astro-text">
                    {p.sanction}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3.5 text-xs text-astro-text-dim [text-wrap:pretty]">
              Carrying one? It shows on your own profile and nobody else's.
            </p>
          </div>

          <div className="astro-card p-5.5">
            <div className="mb-1.5 text-sm font-extrabold text-astro-text">Something missing?</div>
            <p className="text-[13px] text-astro-text-muted [text-wrap:pretty]">
              Post it in the feed. Enough traction and it's a real proposal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
