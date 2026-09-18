import { useQuery } from '@tanstack/react-query'
import { fetchArticles } from './api'

export function useArticles() {
  return useQuery({ queryKey: ['articles'], queryFn: fetchArticles })
}
