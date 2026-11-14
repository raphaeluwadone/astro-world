import { useQuery } from '@tanstack/react-query'
import { fetchRankings } from './api'

export function useRankings() {
  return useQuery({ queryKey: ['rankings'], queryFn: fetchRankings })
}
