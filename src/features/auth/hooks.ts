import { useQuery } from '@tanstack/react-query'
import { fetchPublicRosterSize } from './api'

export function usePublicRosterSize() {
  return useQuery({ queryKey: ['public-roster-size'], queryFn: fetchPublicRosterSize })
}
