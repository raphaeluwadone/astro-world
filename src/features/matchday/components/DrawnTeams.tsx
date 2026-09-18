import type { TeamWithMembers } from '../api'

export function DrawnTeams({ teams }: { teams: TeamWithMembers[] }) {
  return (
    <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
      {teams.map((team) => (
        <div
          key={team.id}
          className="relative overflow-hidden rounded-2xl border border-border bg-astro-surface p-[18px]"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
        >
          <div
            className="absolute inset-y-0 left-0 w-1"
            style={{ background: team.colour }}
            aria-hidden="true"
          />
          <div className="mb-3.5 flex items-center gap-[9px]">
            <span className="size-3 shrink-0 rounded" style={{ background: team.colour }} />
            <span className="font-display text-2xl leading-none text-astro-text">{team.greek_name}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {team.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-[9px] rounded-lg bg-astro-surface-2 px-[10px] py-[7px]"
              >
                <span className="font-display w-4 text-[15px] text-astro-text-dim">
                  {m.favourite_number ?? ''}
                </span>
                <span className="truncate text-[12.5px] font-bold text-astro-text">{m.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
