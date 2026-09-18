import type { MotmWinner } from '../api'

export function MotmCard({ motm }: { motm: MotmWinner }) {
  return (
    <div className="rounded-2xl border border-[rgba(166,63,255,0.22)] bg-astro-surface p-6">
      <div className="astro-eyebrow mb-4">Man of the match &middot; voted</div>
      <div className="flex items-center gap-4">
        <div
          className="size-[68px] shrink-0 rounded-2xl"
          style={{ background: 'linear-gradient(150deg, #2c3c74, #131c3a)' }}
        />
        <div className="min-w-0">
          <div className="font-display text-4xl leading-[0.95] text-astro-text">
            {motm.player.nickname}
          </div>
          <div className="truncate text-[12.5px] text-astro-text-muted">{motm.player.full_name}</div>
        </div>
        <div className="ml-auto shrink-0 font-display text-[44px] leading-none text-astro-accent">
          {motm.voteCount}
          <span className="text-lg text-astro-text-dim">/{motm.totalVotes}</span>
        </div>
      </div>
      <p className="mt-[18px] text-[13px] text-astro-text-muted">
        Most nominations for the matchday, tallied anonymously across every match played.
      </p>
    </div>
  )
}
