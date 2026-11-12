import { NothingHere } from '@/components/states/NothingHere'
import { Scene } from '@/components/states/Scene'
import type { MentionedRow } from '../api'
import { BadgeMark } from '@/features/badges/components/BadgeMark'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import { PlayerHoverCard } from '@/components/hover/InfoCards'

export function MostMentioned({ mentioned }: { mentioned: MentionedRow[] }) {
  return (
    <div className="astro-card p-[22px]">
      <h2 className="mb-3.5 font-display text-[26px] leading-none text-astro-text">Most Mentioned</h2>
      {mentioned.length === 0 ? (
        <NothingHere compact icon={<Scene kind="chat" />} body="Nobody's been called out yet." />
      ) : (
        <div className="flex flex-col gap-[9px]">
          {mentioned.map((m) => (
            <div key={m.player_id} className="flex items-center gap-[11px]">
              <div className="relative shrink-0">
                <PlayerPhoto playerId={m.player_id} alt="" className="size-8 rounded-[9px]" />
                <BadgeMark playerId={m.player_id} size={14} showExtra={false} className="absolute -bottom-1.5 -right-1.5" />
              </div>
              <div className="min-w-0 flex-1 truncate text-[13px] font-extrabold text-astro-text">
                <PlayerHoverCard playerId={m.player_id} name={m.nickname} className="hover:underline">
                  {m.nickname}
                </PlayerHoverCard>
              </div>
              <div aria-label={`${m.count} mentions`} className="flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(56,189,248,0.3)] bg-astro-surface-2 px-[11px] py-1">
                <span className="text-[11.5px] font-extrabold text-astro-cyan">{m.count}</span>
                <span className="hidden text-[11px] text-astro-text-dim xl:inline">mentions</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
