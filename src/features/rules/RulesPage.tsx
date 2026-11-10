import { useState } from 'react'
import { usePublicRosterSize } from '@/features/auth/hooks'
import { formatAmendmentDate, LATEST_AMENDMENT, PUNISHMENTS, RULE_GLANCE_STATIC, RULE_SECTIONS } from './content'
import { RuleHistorySheet } from './RuleHistorySheet'

const SEVERITY_STYLE: Record<string, string> = {
  Light: 'bg-astro-cyan/15 border border-astro-cyan/45 text-astro-cyan',
  Heavy: 'bg-astro-amber/15 border border-astro-amber/45 text-astro-amber',
  Severe: 'bg-astro-red/15 border border-astro-red/45 text-astro-red',
}

export function RulesPage() {
  const { data: rosterSize } = usePublicRosterSize()
  const [historyOpen, setHistoryOpen] = useState(false)

  const glance = [{ k: 'Group', v: rosterSize != null ? String(rosterSize) : '—' }, ...RULE_GLANCE_STATIC]

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
        <span>Last amended {formatAmendmentDate(LATEST_AMENDMENT.date)}</span>
        <span aria-hidden="true">&middot;</span>
        <button type="button" onClick={() => setHistoryOpen(true)} className="uppercase tracking-[0.16em] text-astro-text-muted underline-offset-4 hover:text-astro-text hover:underline">
          History
        </button>
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
                      {r.tag &&
                        (r.tagTone === 'pending' ? (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-astro-amber/80">
                            <span className="size-1.5 rounded-full bg-astro-amber/80" />
                            {r.tag}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setHistoryOpen(true)}
                            className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-astro-text-dim hover:text-astro-text-muted"
                          >
                            <span className="size-1.5 rounded-full bg-astro-accent/70" />
                            {r.tag}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
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

      <RuleHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  )
}
