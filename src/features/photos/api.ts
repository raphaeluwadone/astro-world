import { supabase } from '@/lib/supabase'
import type { CroppedPhoto, PhotoEdit } from './PhotoCropDialog'

const BUCKET = 'player-photos'

export async function fetchPlayerPhotos(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('players').select('id, photo_url').not('photo_url', 'is', null)
  if (error) throw error
  return new Map((data ?? []).map((p) => [p.id, p.photo_url as string]))
}

function pathFromUrl(url: string | null | undefined) {
  const marker = `/object/public/${BUCKET}/`
  const i = url?.indexOf(marker) ?? -1
  return i >= 0 ? decodeURIComponent(url!.slice(i + marker.length).split('?')[0]) : null
}

export interface PhotoState {
  url: string | null
  originalUrl: string | null
  edit: PhotoEdit | null
}

export async function fetchPhotoState(playerId: string): Promise<PhotoState> {
  const { data, error } = await supabase.from('players').select('photo_url, photo_original_url, photo_edit').eq('id', playerId).single()
  if (error) throw error
  return { url: data.photo_url, originalUrl: data.photo_original_url, edit: data.photo_edit as PhotoEdit | null }
}

async function put(playerId: string, blob: Blob, prefix = '') {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${playerId}/${prefix}${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
  if (error) throw error
  return { path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
}

const drop = async (urls: (string | null | undefined)[]) => {
  const paths = urls.map(pathFromUrl).filter((p): p is string => !!p)
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
}

/**
 * Saves a cropped card photo. A fresh upload also stores its original; an edit keeps the stored one.
 * Photos from before originals were kept become their own original on first edit.
 */
export async function savePlayerPhoto(playerId: string, photo: CroppedPhoto, previous: PhotoState) {
  const card = await put(playerId, photo.card)
  const original = photo.original ? await put(playerId, photo.original, 'original-') : null
  const originalUrl = original?.url ?? previous.originalUrl ?? previous.url
  const { error } = await supabase
    .from('players')
    .update({ photo_url: card.url, photo_original_url: originalUrl, photo_edit: { ...photo.edit } })
    .eq('id', playerId)
  if (error) {
    await supabase.storage.from(BUCKET).remove([card.path, ...(original ? [original.path] : [])])
    throw error
  }
  const keep = new Set([card.url, originalUrl])
  await drop([previous.url, previous.originalUrl].filter((u) => u && !keep.has(u)))
  return card.url
}

export async function removePlayerPhoto(playerId: string, previous: PhotoState) {
  const { error } = await supabase.from('players').update({ photo_url: null, photo_original_url: null, photo_edit: null }).eq('id', playerId)
  if (error) throw error
  await drop([previous.url, previous.originalUrl])
}
