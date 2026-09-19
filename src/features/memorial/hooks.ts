import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTribute, fetchTributes } from './api'

export function useTributes() {
  return useQuery({ queryKey: ['tributes'], queryFn: fetchTributes })
}

export function useCreateTribute(authorId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => createTribute(authorId!, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tributes'] }),
  })
}
