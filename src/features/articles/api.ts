import { supabase } from '@/lib/supabase'

export interface ArticleRow {
  id: string
  title: string
  kicker: string | null
  body: string
  cover_image_url: string | null
  published_at: string | null
  author: { id: string; nickname: string } | null
}

const COLUMNS = 'id, title, kicker, body, cover_image_url, published_at, author:players!articles_author_id_fkey(id, nickname)'

export async function fetchArticles(): Promise<ArticleRow[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(COLUMNS)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Drafts the viewer can see: their own, or everyone's for admins (RLS decides). */
export async function fetchDrafts(): Promise<ArticleRow[]> {
  const { data, error } = await supabase.from('articles').select(COLUMNS).is('published_at', null).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export type ArticleDetail = ArticleRow

// Postgres rejects a malformed uuid with 22P02; treat that as not found.
const INVALID_UUID = '22P02'

export async function fetchArticle(id: string): Promise<ArticleDetail | null> {
  const { data, error } = await supabase.from('articles').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) {
    if (error.code === INVALID_UUID) return null
    throw error
  }
  return data
}

export interface ArticleDraft {
  title: string
  kicker: string
  body: string
  cover_image_url: string | null
}

export async function saveArticle(id: string | null, authorId: string, draft: ArticleDraft): Promise<string> {
  const row = { title: draft.title.trim(), kicker: draft.kicker.trim() || null, body: draft.body, cover_image_url: draft.cover_image_url }
  if (id) {
    const { error } = await supabase.from('articles').update(row).eq('id', id)
    if (error) throw error
    return id
  }
  const { data, error } = await supabase.from('articles').insert({ ...row, author_id: authorId }).select('id').single()
  if (error) throw error
  return data.id
}

export async function setPublished(id: string, published: boolean) {
  const { error } = await supabase
    .from('articles')
    .update({ published_at: published ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) throw error
}

export async function deleteArticle(id: string) {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
}

const IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/gif']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export async function uploadArticleImage(playerId: string, file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Use a JPG, PNG, WebP or GIF.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('That image is over 5 MB.')
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `${playerId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('article-images').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from('article-images').getPublicUrl(path).data.publicUrl
}

export async function fetchCanWrite(): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_write_articles')
  if (error) throw error
  return !!data
}

export interface WriterRow {
  playerId: string
  nickname: string
  grantedAt: string
}

export async function fetchWriters(): Promise<WriterRow[]> {
  const { data, error } = await supabase
    .from('article_writers')
    .select('player_id, granted_at, player:players!article_writers_player_id_fkey(nickname)')
    .order('granted_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((w) => ({ playerId: w.player_id, nickname: w.player?.nickname ?? 'Unknown', grantedAt: w.granted_at }))
}

export async function grantWriter(playerId: string, grantedBy: string) {
  const { error } = await supabase.from('article_writers').insert({ player_id: playerId, granted_by: grantedBy })
  if (error) throw error
}

export async function revokeWriter(playerId: string) {
  const { error } = await supabase.from('article_writers').delete().eq('player_id', playerId)
  if (error) throw error
}
