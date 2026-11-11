import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchConfirmedPlayerIds } from './api'

/** Monthly members (minus opt-outs) plus weekly claims, with nicknames, for the draw. */
export function useConfirmedPlayers(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['confirmed-players', matchdayId],
    enabled: !!matchdayId,
    queryFn: async () => {
      const ids = await fetchConfirmedPlayerIds(matchdayId!)
      if (ids.length === 0) return []
      const { data, error } = await supabase.from('players').select('id, nickname').in('id', ids).order('nickname')
      if (error) throw error
      return data ?? []
    },
  })
}
