import { supabase } from '@/lib/supabase'

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

/** Uploads a new card photo, points the player at it, then removes the one it replaced. */
export async function uploadPlayerPhoto(playerId: string, blob: Blob, previousUrl: string | null) {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${playerId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const { error } = await supabase.from('players').update({ photo_url: data.publicUrl }).eq('id', playerId)
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
  const old = pathFromUrl(previousUrl)
  if (old) await supabase.storage.from(BUCKET).remove([old])
  return data.publicUrl
}

export async function removePlayerPhoto(playerId: string, currentUrl: string | null) {
  const { error } = await supabase.from('players').update({ photo_url: null }).eq('id', playerId)
  if (error) throw error
  const old = pathFromUrl(currentUrl)
  if (old) await supabase.storage.from(BUCKET).remove([old])
}
