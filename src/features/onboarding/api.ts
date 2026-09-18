import { supabase } from '@/lib/supabase'

export async function markOnboarded(playerId: string) {
  const { error } = await supabase
    .from('players')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', playerId)
  if (error) throw error
}
