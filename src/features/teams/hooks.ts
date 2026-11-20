import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { closeCycle, cycleStandings, fetchCycleMatches, fetchCycles, type FinalRow, type TeamCycle } from './cycles'

export function useTeamCycles() {
  return useQuery({ queryKey: ['team-cycles'], queryFn: fetchCycles, staleTime: 5 * 60_000 })
}

export function useCurrentCycle() {
  const q = useTeamCycles()
  return { ...q, data: q.data?.find((c) => !c.closed_at) }
}

export function useCycleStandings(cycle: TeamCycle | undefined) {
  return useQuery({
    queryKey: ['cycle-standings', cycle?.id, cycle?.closed_at],
    enabled: !!cycle,
    queryFn: async () => cycleStandings(await fetchCycleMatches(cycle!)),
  })
}

/** Titles per shirt, for the champion stars. */
export function useTeamTitles() {
  const { data: cycles = [] } = useTeamCycles()
  const titles = new Map<string, string[]>()
  for (const c of cycles) if (c.champion) titles.set(c.champion, [...(titles.get(c.champion) ?? []), c.label])
  return titles
}

export function useCloseCycle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { champion: string; table: FinalRow[]; nextLabel: string; nextEndsAt: string }) => closeCycle(v.champion, v.table, v.nextLabel, v.nextEndsAt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-cycles'] })
      qc.invalidateQueries({ queryKey: ['cycle-standings'] })
      qc.invalidateQueries({ queryKey: ['community-feed'] })
    },
  })
}
