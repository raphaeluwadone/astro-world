import { useTeamTitles } from '../hooks'

/** Gold stars beside a shirt's name, one per title (a number past three). */
export function ChampionStars({ team, className }: { team: string; className?: string }) {
  const titles = useTeamTitles().get(team)
  if (!titles?.length) return null
  return (
    <span className={className ?? 'inline-flex shrink-0 items-center gap-px text-[#f7c25e]'} title={`Champions ${titles.join(', ')}`} aria-label={`${titles.length}-time champions`}>
      {titles.length > 3 ? (
        <>
          <Star />
          <span className="text-[10px] font-extrabold">{titles.length}</span>
        </>
      ) : (
        titles.map((t) => <Star key={t} />)
      )}
    </span>
  )
}

function Star() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 2 3 6.6 7.2.7-5.4 4.8 1.6 7.1L12 17.5l-6.4 3.7 1.6-7.1L1.8 9.3 9 8.6Z" />
    </svg>
  )
}
