import { useQuery } from '@tanstack/react-query'
import { fetchRankings, fetchSeasonTeamStandings } from './api'

export function useRankings() {
  return useQuery({ queryKey: ['rankings'], queryFn: fetchRankings })
}

export function useSeasonTeamStandings() {
  return useQuery({ queryKey: ['season-team-standings'], queryFn: fetchSeasonTeamStandings })
}
