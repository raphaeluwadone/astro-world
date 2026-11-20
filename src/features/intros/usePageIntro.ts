import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { supabase } from '@/lib/supabase'

export type IntroKey = 'salami-cup'

/** A page's first-visit intro: shown until the player dismisses it once, on any device. */
export function usePageIntro(key: IntroKey) {
  const { player } = useCurrentPlayer()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)

  const markSeen = useMutation({
    mutationFn: async () => {
      if (!player) return
      const { error } = await supabase
        .from('players')
        .update({ seen_intros: [...new Set([...player.seen_intros, key])] })
        .eq('id', player.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['current-player'] }),
  })

  return {
    show: !!player && !dismissed && !player.seen_intros.includes(key),
    dismiss: () => {
      setDismissed(true)
      markSeen.mutate()
    },
  }
}
