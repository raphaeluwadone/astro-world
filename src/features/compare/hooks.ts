import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchCompare, type CompareScope } from './api'

export function useCompare(scope: CompareScope) {
  return useQuery({ queryKey: ['compare', scope], queryFn: () => fetchCompare(scope), placeholderData: keepPreviousData })
}
