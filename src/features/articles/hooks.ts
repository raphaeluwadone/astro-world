import { useQuery } from '@tanstack/react-query'
import { fetchArticle, fetchArticles } from './api'

export function useArticles() {
  return useQuery({ queryKey: ['articles'], queryFn: fetchArticles })
}

export function useArticle(id: string) {
  return useQuery({ queryKey: ['article', id], queryFn: () => fetchArticle(id) })
}
