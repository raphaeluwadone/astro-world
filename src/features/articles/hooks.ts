import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentPlayer } from '@/features/auth/useSession'
import {
  deleteArticle,
  fetchArticle,
  fetchArticles,
  fetchCanWrite,
  fetchDrafts,
  fetchWriters,
  grantWriter,
  revokeWriter,
  saveArticle,
  setPublished,
  type ArticleDraft,
} from './api'

export function useArticles() {
  return useQuery({ queryKey: ['articles'], queryFn: fetchArticles })
}

export function useDrafts(enabled: boolean) {
  return useQuery({ queryKey: ['articles', 'drafts'], queryFn: fetchDrafts, enabled })
}

export function useArticle(id: string | null) {
  return useQuery({ queryKey: ['article', id], queryFn: () => fetchArticle(id!), enabled: !!id })
}

export function useCanWrite() {
  const { player } = useCurrentPlayer()
  return useQuery({ queryKey: ['can-write-articles', player?.id], queryFn: fetchCanWrite, enabled: !!player })
}

function useInvalidateArticles() {
  const qc = useQueryClient()
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: ['articles'] })
    if (id) qc.invalidateQueries({ queryKey: ['article', id] })
  }
}

export function useSaveArticle() {
  const { player } = useCurrentPlayer()
  const invalidate = useInvalidateArticles()
  return useMutation({
    mutationFn: ({ id, draft }: { id: string | null; draft: ArticleDraft }) => saveArticle(id, player!.id, draft),
    onSuccess: (id) => invalidate(id),
  })
}

export function useSetPublished() {
  const invalidate = useInvalidateArticles()
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => setPublished(id, published),
    onSuccess: (_, { id }) => invalidate(id),
  })
}

export function useDeleteArticle() {
  const invalidate = useInvalidateArticles()
  return useMutation({ mutationFn: deleteArticle, onSuccess: () => invalidate() })
}

export function useWriters() {
  return useQuery({ queryKey: ['article-writers'], queryFn: fetchWriters })
}

export function useSetWriter() {
  const { player } = useCurrentPlayer()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ playerId, on }: { playerId: string; on: boolean }) => (on ? grantWriter(playerId, player!.id) : revokeWriter(playerId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article-writers'] })
      qc.invalidateQueries({ queryKey: ['can-write-articles'] })
    },
  })
}
