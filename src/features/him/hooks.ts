import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { castVote } from '@/features/profile/api'
import { fetchHimBoard } from './api'

export function useHimBoard(viewerId: string | null) {
  return useQuery({ queryKey: ['him-board', viewerId], queryFn: () => fetchHimBoard(viewerId), enabled: !!viewerId })
}

export function useBoardVote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: castVote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['him-board'] })
      qc.invalidateQueries({ queryKey: ['player-comparisons'] })
      qc.invalidateQueries({ queryKey: ['comparison-last-dropped'] })
    },
  })
}
