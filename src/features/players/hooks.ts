import { useQuery } from '@tanstack/react-query'
import { fetchPlayerCards } from './api'

export function usePlayerCards() {
  return useQuery({ queryKey: ['player-cards'], queryFn: fetchPlayerCards })
}
