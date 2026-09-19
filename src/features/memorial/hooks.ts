import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTribute, deleteTribute, fetchTributes } from './api'

export function useTributes() {
  return useQuery({ queryKey: ['tributes'], queryFn: fetchTributes })
}

// meta.silent: Ade's page has no toasts at all, a posted or removed
// tribute is obvious from the list changing. See main.tsx's MutationCache.
export function useCreateTribute(authorId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => createTribute(authorId!, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tributes'] }),
    meta: { silent: true },
  })
}

export function useDeleteTribute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tributeId: string) => deleteTribute(tributeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tributes'] }),
    meta: { silent: true },
  })
}
