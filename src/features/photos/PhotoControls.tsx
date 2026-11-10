import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { usePhotoState, useRemovePlayerPhoto, useSavePlayerPhoto } from './hooks'
import { PhotoCropDialog, type PhotoSource } from './PhotoCropDialog'

const MAX_BYTES = 15 * 1024 * 1024

/** Choose, crop, edit or remove a player's card photo. Used by the player and by admins. */
export function PhotoControls({ playerId, size = 'default' }: { playerId: string; size?: 'default' | 'sm' }) {
  const { data: state } = usePhotoState(playerId)
  const current = state?.url ?? null
  const upload = useSavePlayerPhoto(playerId)
  const remove = useRemovePlayerPhoto(playerId)
  const input = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<PhotoSource | null>(null)
  const busy = upload.isPending || remove.isPending

  const pick = (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return toast.error('That isn’t an image.')
    if (f.size > MAX_BYTES) return toast.error('That photo is over 15 MB. Try a smaller one.')
    setSource({ file: f })
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {current && state && (
          <Button size={size} disabled={busy} onClick={() => setSource({ url: state.originalUrl ?? current, edit: state.edit })}>
            Edit photo
          </Button>
        )}
        <Button size={size} variant={current ? 'outline' : 'default'} onClick={() => input.current?.click()} disabled={busy}>
          {current ? 'Change photo' : 'Add a photo'}
        </Button>
        {current && state && (
          <Button
            size={size}
            variant="ghost"
            disabled={busy}
            onClick={() =>
              remove.mutate(state, {
                onSuccess: () => toast.success('Photo removed'),
                onError: () => toast.error('Couldn’t remove the photo. Try again.'),
              })
            }
          >
            {remove.isPending ? 'Removing…' : 'Remove'}
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <PhotoCropDialog
        source={source}
        saving={upload.isPending}
        onCancel={() => setSource(null)}
        onConfirm={(photo) =>
          upload.mutate(
            { photo, previous: state ?? { url: null, originalUrl: null, edit: null } },
            {
              onSuccess: () => {
                setSource(null)
                toast.success('Photo saved')
              },
              onError: () => toast.error('Couldn’t save the photo. Try again.'),
            },
          )
        }
      />
    </>
  )
}
