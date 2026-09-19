import { supabase } from '@/lib/supabase'

export interface TributeRow {
  id: string
  content: string
  created_at: string
  author: { id: string; nickname: string; full_name: string }
}

export async function fetchTributes(): Promise<TributeRow[]> {
  const { data, error } = await supabase
    .from('tributes')
    .select('id, content, created_at, players!tributes_author_id_fkey (id, nickname, full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((t) => ({
    id: t.id,
    content: t.content,
    created_at: t.created_at,
    author: t.players as unknown as TributeRow['author'],
  }))
}

export async function createTribute(authorId: string, content: string) {
  const { error } = await supabase.from('tributes').insert({ author_id: authorId, content })
  if (error) throw error
}

export async function deleteTribute(tributeId: string) {
  const { error } = await supabase.from('tributes').delete().eq('id', tributeId)
  if (error) throw error
}
