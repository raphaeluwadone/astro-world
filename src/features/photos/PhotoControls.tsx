import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRemovePlayerPhoto, useUploadPlayerPhoto, usePlayerPhoto } from './hooks'
import { PhotoCropDialog } from './PhotoCropDialog'

const MAX_BYTES = 15 * 1024 * 1024

/** Choose, crop and save a player's card photo, or remove it. Used by the player and by admins. */
export function PhotoControls({ playerId, size = 'default' }: { playerId: string; size?: 'default' | 'sm' }) {
  const current = usePlayerPhoto(playerId)
  const upload = useUploadPlayerPhoto(playerId)
  const remove = useRemovePlayerPhoto(playerId)
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const pick = (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return toast.error('That isn’t an image.')
    if (f.size > MAX_BYTES) return toast.error('That photo is over 15 MB. Try a smaller one.')
    setFile(f)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size={size} onClick={() => input.current?.click()} disabled={upload.isPending || remove.isPending}>
          {current ? 'Change photo' : 'Add a photo'}
        </Button>
        {current && (
          <Button
            size={size}
            variant="ghost"
            disabled={upload.isPending || remove.isPending}
            onClick={() =>
              remove.mutate(current, {
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
        file={file}
        saving={upload.isPending}
        onCancel={() => setFile(null)}
        onConfirm={(blob) =>
          upload.mutate(
            { blob, previousUrl: current },
            {
              onSuccess: () => {
                setFile(null)
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
