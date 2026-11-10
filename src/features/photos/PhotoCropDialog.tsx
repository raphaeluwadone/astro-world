import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

const FRAME_W = 288
const FRAME_H = 360
const OUT_W = 800
const OUT_H = 1000

interface Size {
  w: number
  h: number
}

function clampOffset(x: number, y: number, img: Size, scale: number) {
  const maxX = Math.max(0, (img.w * scale - FRAME_W) / 2)
  const maxY = Math.max(0, (img.h * scale - FRAME_H) / 2)
  return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) }
}

async function encode(canvas: HTMLCanvasElement): Promise<Blob> {
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.86))
  // Safari can't encode WebP and quietly hands back a PNG, so fall back to JPEG there.
  if (webp?.type === 'image/webp') return webp
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.88))
  if (!jpeg) throw new Error('Could not process that image')
  return jpeg
}

/** Pan and zoom a picked image into the 4:5 card frame, then export it at 800×1000. */
export function PhotoCropDialog({
  file,
  saving,
  onCancel,
  onConfirm,
}: {
  file: File | null
  saving: boolean
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [img, setImg] = useState<Size | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const imgEl = useRef<HTMLImageElement>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setSrc(url)
    setImg(null)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    return () => URL.revokeObjectURL(url)
  }, [file])

  const cover = img ? Math.max(FRAME_W / img.w, FRAME_H / img.h) : 1
  const scale = cover * zoom

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    setDragging(true)
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !img) return
    setOffset(clampOffset(drag.current.ox + e.clientX - drag.current.x, drag.current.oy + e.clientY - drag.current.y, img, scale))
  }
  const onUp = () => {
    drag.current = null
    setDragging(false)
  }

  const setZoomClamped = (z: number) => {
    setZoom(z)
    if (img) setOffset((o) => clampOffset(o.x, o.y, img, cover * z))
  }

  const save = async () => {
    if (!img || !imgEl.current) return
    const canvas = document.createElement('canvas')
    canvas.width = OUT_W
    canvas.height = OUT_H
    const ctx = canvas.getContext('2d')!
    const k = OUT_W / FRAME_W
    const w = img.w * scale * k
    const h = img.h * scale * k
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(imgEl.current, (OUT_W - w) / 2 + offset.x * k, (OUT_H - h) / 2 + offset.y * k, w, h)
    onConfirm(await encode(canvas))
  }

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && !saving && onCancel()}>
      <DialogContent className="max-w-[360px] gap-0 border border-white/[0.08] bg-astro-surface p-5 text-astro-text sm:max-w-[360px]">
        <DialogTitle className="font-display text-[28px] font-normal leading-none text-astro-text">Position your photo</DialogTitle>
        <DialogDescription className="mb-4 mt-1 text-[12.5px] text-astro-text-muted">Drag to move it, use the slider to zoom.</DialogDescription>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-[14px] bg-astro-bg"
          style={{ width: FRAME_W, height: FRAME_H, cursor: dragging ? 'grabbing' : 'grab' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {src && (
            <img
              ref={imgEl}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => setImg({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={
                img
                  ? {
                      width: img.w * scale,
                      height: img.h * scale,
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    }
                  : { opacity: 0 }
              }
            />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-[14px] ring-1 ring-inset ring-white/20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-[linear-gradient(transparent,rgba(10,15,31,0.6))]" />
        </div>

        <label className="mt-4 flex items-center gap-3 text-xs font-bold text-astro-text-muted">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoomClamped(Number(e.target.value))}
            className="flex-1 accent-[#a63fff]"
            aria-label="Zoom"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!img || saving}>
            {saving ? 'Saving…' : 'Save photo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
