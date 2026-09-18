import { supabase } from '@/lib/supabase'

export interface ArticleRow {
  id: string
  title: string
  kicker: string | null
  body: string
  published_at: string | null
}

export async function fetchArticles(): Promise<ArticleRow[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, kicker, body, published_at')
    .order('published_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data ?? []
}
