import { supabase } from '@/lib/supabase'
import type { ComparisonRow } from '@/features/profile/api'

export interface BoardClaim extends ComparisonRow {
  playerId: string
  createdBy: string
}

/** Every live I Am Him and You Are Him claim across the group, with vote totals and the viewer's own vote. */
export async function fetchHimBoard(viewerId: string | null): Promise<BoardClaim[]> {
  const [{ data: claims, error }, { data: votes, error: votesError }] = await Promise.all([
    supabase
      .from('player_comparisons')
      .select('id, player_id, source, created_by, pro_players (name, nationality, role, photo_url, apps, goals, assists)')
      .is('dropped_at', null),
    supabase.from('comparison_votes').select('comparison_id, voter_id, direction'),
  ])
  if (error) throw error
  if (votesError) throw votesError

  const tally = new Map<string, { up: number; down: number; mine: 'up' | 'down' | null }>()
  for (const v of votes ?? []) {
    const t = tally.get(v.comparison_id) ?? { up: 0, down: 0, mine: null }
    if (v.direction === 'up') t.up += 1
    else t.down += 1
    if (v.voter_id === viewerId) t.mine = v.direction
    tally.set(v.comparison_id, t)
  }

  return (claims ?? []).map((c) => {
    const t = tally.get(c.id)
    return {
      id: c.id,
      playerId: c.player_id,
      createdBy: c.created_by,
      source: c.source,
      pro: c.pro_players as unknown as ComparisonRow['pro'],
      upvotes: t?.up ?? 0,
      downvotes: t?.down ?? 0,
      myVote: t?.mine ?? null,
    }
  })
}
