import { useQuery } from '@tanstack/react-query'
import { DayTable } from '@/features/admin/pitch/DayTable'
import { usePitch } from '@/features/admin/pitch/hooks'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { supabase } from '@/lib/supabase'
import { useDrawnTeams, useNextMatchday } from '../hooks'

export type TablePhase = 'during' | 'after'

async function fetchLastPlayedWithGames() {
  const { data, error } = await supabase
    .from('pitch_games')
    .select('matchdays!inner (id, played_at, status)')
    .eq('matchdays.status', 'played')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data?.matchdays as { id: string; played_at: string } | undefined) ?? null
}

/** The matchday whose table to show: today's while it's being played, otherwise the last one played on Pitch-side. */
export function useTableMatchday() {
  const { data: next } = useNextMatchday()
  const drawn = next?.status === 'drawn' ? next : undefined
  const { data: livePitch } = usePitch(drawn?.id)
  const during = !!drawn && (livePitch?.games.length ?? 0) > 0
  const { data: last } = useQuery({ queryKey: ['matchday', 'last-with-pitch'], queryFn: fetchLastPlayedWithGames, enabled: !during })
  if (during) return { matchday: drawn, phase: 'during' as const }
  return last ? { matchday: last, phase: 'after' as const } : null
}

/** The matchday table as a card, rendered only in the slot for its phase. */
export function DayTableCard({ phase }: { phase: TablePhase }) {
  const { player } = useCurrentPlayer()
  const current = useTableMatchday()
  const show = current?.phase === phase
  const id = show ? current.matchday.id : undefined
  const { data: teams = [] } = useDrawnTeams(id)
  const { data: pitch } = usePitch(id)
  if (!show || !pitch || teams.length < 2) return null
  const myTeamId = teams.find((t) => t.members.some((m) => m.id === player?.id))?.id
  const title =
    phase === 'during' ? 'Today’s table' : `Table, ${new Date(current.matchday.played_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
  return <DayTable teams={teams} pitch={pitch} myTeamId={myTeamId} title={title} className="astro-card p-4" />
}
