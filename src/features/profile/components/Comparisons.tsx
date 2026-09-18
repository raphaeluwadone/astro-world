import type { ComparisonRow } from '../api'

function ComparisonCard({ c }: { c: ComparisonRow }) {
  const net = c.upvotes - c.downvotes
  return (
    <div className="rounded-[14px] border border-border bg-astro-surface-2 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="size-12 shrink-0 rounded-[11px]"
          style={{ background: 'linear-gradient(150deg, #2c3c74, #131c3a)' }}
        />
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-extrabold text-astro-text">{c.pro.name}</div>
          <div className="text-[11.5px] text-astro-text-dim">
            {c.pro.nationality ?? '—'} &middot; {c.pro.role ?? '—'}
          </div>
        </div>
      </div>
      <div className="mb-3.5 flex gap-2">
        <div className="flex-1 rounded-lg bg-astro-bg px-2.5 py-2">
          <div className="text-[9px] font-extrabold tracking-[0.1em] text-astro-text-dim">APPS</div>
          <div className="font-display text-xl leading-[1.1] text-astro-text">{c.pro.apps ?? '—'}</div>
        </div>
        <div className="flex-1 rounded-lg bg-astro-bg px-2.5 py-2">
          <div className="text-[9px] font-extrabold tracking-[0.1em] text-astro-text-dim">GOALS</div>
          <div className="font-display text-xl leading-[1.1] text-astro-text">{c.pro.goals ?? '—'}</div>
        </div>
        <div className="flex-1 rounded-lg bg-astro-bg px-2.5 py-2">
          <div className="text-[9px] font-extrabold tracking-[0.1em] text-astro-text-dim">ASSISTS</div>
          <div className="font-display text-xl leading-[1.1] text-astro-text">{c.pro.assists ?? '—'}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex min-h-9 items-center gap-[7px] rounded-[9px] border border-[rgba(74,222,128,0.34)] bg-astro-bg px-[11px] py-[7px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#4ade80">
            <path d="M12 3.4 21 13h-5.4v7.6H8.4V13H3Z" />
          </svg>
          <span className="text-[12.5px] font-extrabold text-astro-green">{c.upvotes}</span>
        </div>
        <div className="flex min-h-9 items-center gap-[7px] rounded-[9px] border border-[rgba(224,72,63,0.34)] bg-astro-bg px-[11px] py-[7px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#e0483f">
            <path d="M12 20.6 3 11h5.4V3.4h7.2V11H21Z" />
          </svg>
          <span className="text-[12.5px] font-extrabold text-astro-red">{c.downvotes}</span>
        </div>
        <span className={`ml-auto font-display text-lg ${net >= 0 ? 'text-astro-accent' : 'text-astro-red'}`}>
          {net >= 0 ? '+' : ''}
          {net}
        </span>
      </div>
    </div>
  )
}

function ComparisonSection({
  title,
  titleColor,
  caption,
  description,
  comparisons,
  ctaLabel,
  special,
}: {
  title: string
  titleColor: string
  caption: string
  description: string
  comparisons: ComparisonRow[]
  ctaLabel: string
  special: boolean
}) {
  const totalVotes = comparisons.reduce((sum, c) => sum + c.upvotes + c.downvotes, 0)
  return (
    <div
      className={
        special
          ? 'rounded-2xl border-[1.5px] border-[rgba(166,63,255,0.4)] bg-astro-surface p-6'
          : 'rounded-2xl border border-border bg-astro-surface p-6'
      }
    >
      <div className="mb-1.5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-[34px] leading-none" style={{ color: titleColor }}>
          {title}
        </h2>
        <div className="text-xs text-astro-text-dim">
          {caption} &middot; {totalVotes} votes cast
        </div>
      </div>
      <p className="mb-[18px] text-[13px] text-astro-text-muted">{description}</p>

      {comparisons.length === 0 ? (
        <p className="text-sm text-astro-text-dim">Nothing here yet.</p>
      ) : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))' }}>
          {comparisons.map((c) => (
            <ComparisonCard key={c.id} c={c} />
          ))}
        </div>
      )}

      <div className="mt-4 inline-flex items-center gap-2 rounded-[11px] border border-dashed border-[rgba(166,63,255,0.4)] bg-astro-surface-2 px-4 py-[11px] text-[13px] font-bold text-astro-accent-soft">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.5 3.2h3v7.3h7.3v3h-7.3v7.3h-3v-7.3H3.2v-3h7.3Z" />
        </svg>
        {ctaLabel}
      </div>
    </div>
  )
}

export function Comparisons({ comparisons }: { comparisons: ComparisonRow[] }) {
  const selfClaims = comparisons.filter((c) => c.source === 'self')
  const communityPicks = comparisons.filter((c) => c.source === 'community')

  return (
    <div className="space-y-5">
      <ComparisonSection
        title="I Am Him"
        titleColor="#c589ff"
        caption="Own three"
        description="Who he reckons he plays like. The group gets a say on whether he's dreaming."
        comparisons={selfClaims}
        ctaLabel="Swap one out"
        special
      />
      <ComparisonSection
        title="You Are Him"
        titleColor="#eef0f9"
        caption="Group's three"
        description="Who the group actually thinks he plays like. Top three by net votes."
        comparisons={communityPicks}
        ctaLabel="Nominate someone else"
        special={false}
      />
    </div>
  )
}
