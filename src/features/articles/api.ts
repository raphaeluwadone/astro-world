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

export interface ArticleDetail extends ArticleRow {
  cover_image_url: string | null
}

// Postgres rejects a malformed uuid with 22P02; treat that as not found.
const INVALID_UUID = '22P02'

export async function fetchArticle(id: string): Promise<ArticleDetail | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, kicker, body, published_at, cover_image_url')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    if (error.code === INVALID_UUID) return null
    throw error
  }
  return data
}
