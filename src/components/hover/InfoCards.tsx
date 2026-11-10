import { Link, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { HoverCardEyebrow, InfoHoverCard } from '@/components/ui/info-hover-card'
import { BadgeMark } from '@/features/badges/components/BadgeMark'
import { useTributes } from '@/features/memorial/hooks'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import { usePlayerCards } from '@/features/players/hooks'
import { useCurrentCup } from '@/features/salami-cup/hooks'

const MORE = 'mt-2.5 block text-xs font-bold text-astro-accent-soft hover:underline'

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-astro-bg/60 px-2 py-1.5 text-center">
      <div className="font-display text-[19px] leading-none text-astro-text">{value}</div>
      <div className="mt-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">{label}</div>
    </div>
  )
}

function Holders({ names }: { names: { id: string; nickname: string }[] }) {
  return (
    <>
      {names.slice(0, 4).map((p, i) => (
        <span key={p.id}>
          {i > 0 && ', '}
          <Link to="/players/$playerId" params={{ playerId: p.id }} className="font-bold text-astro-accent-soft hover:underline">
            {p.nickname}
          </Link>
        </span>
      ))}
      {names.length > 4 && ` and ${names.length - 4} more`}
    </>
  )
}

function PlayerCardBody({ playerId }: { playerId: string }) {
  const { data: players = [], isLoading } = usePlayerCards()
  const p = players.find((x) => x.id === playerId)
  if (isLoading) return <div className="py-4 text-xs text-astro-text-dim">Loading…</div>
  if (!p) return <div className="py-2 text-xs text-astro-text-dim">This player isn&rsquo;t on the roster any more.</div>
  return (
    <>
      <div className="mb-3 flex items-center gap-3">
        <PlayerPhoto playerId={p.id} alt="" className="size-14 rounded-[11px]" />
        <div className="min-w-0">
          <HoverCardEyebrow color="#c589ff">
            {p.positions.join(' / ') || 'Player'}
            {p.favourite_number != null && ` · #${p.favourite_number}`}
          </HoverCardEyebrow>
          <div className="flex items-center gap-1.5">
            <span className="truncate font-display text-[24px] leading-none text-astro-text">{p.nickname}</span>
            <BadgeMark playerId={p.id} size={15} max={3} />
          </div>
          <div className="truncate text-xs text-astro-text-muted">{p.full_name}</div>
        </div>
      </div>
      <div className="mb-2.5 grid grid-cols-4 gap-1.5">
        <Stat label="Rating" value={p.avg_rating != null ? Number(p.avg_rating).toFixed(1) : '–'} />
        <Stat label="Apps" value={p.appearances} />
        <Stat label="Goals" value={p.goals} />
        <Stat label="Assists" value={p.assists} />
      </div>
      {(p.favourite_club || p.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-astro-text-muted">
          {p.favourite_club && (
            <span className="flex items-center gap-1">
              {p.favourite_club_logo_url && <img src={p.favourite_club_logo_url} alt="" className="size-3.5 object-contain" />}
              {p.favourite_club}
            </span>
          )}
          {p.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-md bg-white/[0.06] px-1.5 py-px font-bold text-[#c3cbe6]">
              #{t}
            </span>
          ))}
        </div>
      )}
      <Link to="/players/$playerId" params={{ playerId: p.id }} className={MORE}>
        View profile &rarr;
      </Link>
    </>
  )
}

/** A player's name that shows their card on hover and opens their profile on click. */
export function PlayerHoverCard({
  playerId,
  name,
  children,
  className,
  side,
}: {
  playerId: string
  name: string
  children: ReactNode
  className?: string
  side?: 'bottom' | 'right' | 'top'
}) {
  const navigate = useNavigate()
  return (
    <InfoHoverCard
      accent="#a63fff"
      label={`${name}: player card`}
      side={side}
      triggerClassName={className}
      onOpenFull={() => navigate({ to: '/players/$playerId', params: { playerId } })}
      content={<PlayerCardBody playerId={playerId} />}
    >
      {children}
    </InfoHoverCard>
  )
}

function TagCardBody({ label }: { label: string }) {
  const { data: players = [] } = usePlayerCards()
  const holders = players.filter((p) => p.tags.includes(label))
  return (
    <>
      <HoverCardEyebrow color="#c3cbe6">Trait</HoverCardEyebrow>
      <div className="font-display text-[24px] leading-none text-astro-text">#{label}</div>
      <div className="mb-2 mt-1 text-xs text-astro-text-muted">Voted onto players by their teammates. Enough votes and it sticks to their card.</div>
      <div className="text-xs text-astro-text-muted">
        {holders.length === 0 ? (
          <span className="text-astro-text-dim">Nobody carries it yet.</span>
        ) : (
          <>
            <span className="font-bold text-astro-text">Carried by </span>
            <Holders names={holders} />
          </>
        )}
      </div>
      <Link to="/community" className={MORE}>
        Give a teammate a trait &rarr;
      </Link>
    </>
  )
}

export function TagHoverCard({ label, children }: { label: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <InfoHoverCard accent="#c3cbe6" label={`#${label}: about this trait`} onOpenFull={() => navigate({ to: '/community' })} content={<TagCardBody label={label} />}>
      {children}
    </InfoHoverCard>
  )
}

const CUP_STATUS: Record<string, string> = {
  open: 'Entries open',
  drawn: 'Squads drawn',
  live: 'On now',
  played: 'Played',
  cancelled: 'Cancelled',
}

function CupCardBody() {
  const { data: cup } = useCurrentCup()
  const when = cup
    ? new Date(cup.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : null
  return (
    <>
      <HoverCardEyebrow color="#f7c25e">{cup ? `${cup.label} · ${CUP_STATUS[cup.status] ?? cup.status}` : 'Salami Cup'}</HoverCardEyebrow>
      <div className="bg-[linear-gradient(180deg,#ffe8b5,#f2a93b)] bg-clip-text font-display text-[24px] leading-none text-transparent">The Salami Cup</div>
      <div className="mb-2 mt-1 text-xs text-astro-text-muted">Played four times a year in Ade Salami&rsquo;s name, with squads picked by hand.</div>
      {cup && (
        <div className="text-[12.5px] text-astro-text">
          {when}
          {cup.venue ? ` at ${cup.venue}` : ''}
          {cup.status === 'open' && (
            <div className="mt-0.5 text-[11px] text-astro-text-dim">
              Entries close {new Date(cup.entries_close_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
      )}
      <Link to="/salami-cup" className={MORE}>
        Open the cup &rarr;
      </Link>
    </>
  )
}

export function CupHoverCard({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <InfoHoverCard accent="#f2a93b" label="Salami Cup: about the cup" onOpenFull={() => navigate({ to: '/salami-cup' })} content={<CupCardBody />}>
      {children}
    </InfoHoverCard>
  )
}

function MemorialCardBody() {
  const { data: tributes = [] } = useTributes()
  return (
    <>
      <HoverCardEyebrow color="#cbd5f5">In memory · No. 13</HoverCardEyebrow>
      <div className="font-display text-[24px] leading-none text-astro-text">Ade Salami</div>
      <div className="mb-2 mt-1 text-xs text-astro-text-muted [text-wrap:pretty]">
        Started the group chat and bought the first set of bibs. Thirteen was retired in his memory.
      </div>
      <div className="text-[11px] text-astro-text-dim">
        {tributes.length} {tributes.length === 1 ? 'tribute' : 'tributes'} left so far
      </div>
      <Link to="/memorial" className={MORE}>
        Read the tributes &rarr;
      </Link>
    </>
  )
}

export function MemorialHoverCard({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <InfoHoverCard accent="#cbd5f5" label="Salami: in memory" onOpenFull={() => navigate({ to: '/memorial' })} content={<MemorialCardBody />}>
      {children}
    </InfoHoverCard>
  )
}
