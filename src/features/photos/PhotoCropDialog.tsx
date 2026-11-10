import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

const FRAME_W = 288
const FRAME_H = 360
const OUT_W = 800
const OUT_H = 1000
const ORIGINAL_MAX = 1600
const MAX_BLUR = 8
const MAX_TINT = 0.6
const TINT_RGB = '18, 23, 34'

const CANVAS_FILTER = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype

const blurFor = (strength: number) => strength * MAX_BLUR
const tintFor = (strength: number) => `rgba(${TINT_RGB}, ${(strength * MAX_TINT).toFixed(3)})`

export interface PhotoEdit {
  zoom: number
  x: number
  y: number
  blur: boolean
  strength: number
}

export type PhotoSource = { file: File } | { url: string; edit: PhotoEdit | null }

export interface CroppedPhoto {
  card: Blob
  /** Only set for a fresh upload; edits keep the stored original. */
  original: Blob | null
  edit: PhotoEdit
}

const DEFAULT_STRENGTH = 0.4

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

function downscaled(el: HTMLImageElement, img: Size) {
  const k = Math.min(1, ORIGINAL_MAX / Math.max(img.w, img.h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.w * k)
  canvas.height = Math.round(img.h * k)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(el, 0, 0, canvas.width, canvas.height)
  return encode(canvas)
}

/** Pan, zoom and blur an image into the 4:5 card frame, then export it at 800×1000. */
export function PhotoCropDialog({
  source,
  saving,
  onCancel,
  onConfirm,
}: {
  source: PhotoSource | null
  saving: boolean
  onCancel: () => void
  onConfirm: (photo: CroppedPhoto) => void
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [img, setImg] = useState<Size | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const imgEl = useRef<HTMLImageElement>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [blurOn, setBlurOn] = useState(false)
  const [strength, setStrength] = useState(DEFAULT_STRENGTH)
  const effect = blurOn ? strength : 0
  const blur = blurFor(effect)

  useEffect(() => {
    if (!source) return
    const edit = 'url' in source ? source.edit : null
    setImg(null)
    setZoom(edit?.zoom ?? 1)
    setOffset({ x: edit?.x ?? 0, y: edit?.y ?? 0 })
    setBlurOn(edit?.blur ?? false)
    setStrength(edit?.strength ?? DEFAULT_STRENGTH)
    if ('url' in source) {
      // A distinct URL so the browser refetches with CORS instead of reusing a non-CORS cached copy.
      setSrc(`${source.url}${source.url.includes('?') ? '&' : '?'}edit=1`)
      return
    }
    const url = URL.createObjectURL(source.file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [source])

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
    const bleed = blur * 2 * k
    const w = img.w * scale * k + bleed * 2
    const h = img.h * scale * k + bleed * 2
    ctx.imageSmoothingQuality = 'high'
    const x = (OUT_W - w) / 2 + offset.x * k
    const y = (OUT_H - h) / 2 + offset.y * k
    if (blur > 0 && !CANVAS_FILTER) {
      // Safari ignores ctx.filter, so blur by drawing small and scaling back up.
      const f = Math.max(2, blur * k * 0.6)
      const small = document.createElement('canvas')
      small.width = Math.ceil(OUT_W / f)
      small.height = Math.ceil(OUT_H / f)
      small.getContext('2d')!.drawImage(imgEl.current, x / f, y / f, w / f, h / f)
      ctx.drawImage(small, 0, 0, OUT_W, OUT_H)
    } else {
      if (blur > 0) ctx.filter = `blur(${blur * k}px)`
      ctx.drawImage(imgEl.current, x, y, w, h)
      ctx.filter = 'none'
    }
    if (effect > 0) {
      ctx.fillStyle = tintFor(effect)
      ctx.fillRect(0, 0, OUT_W, OUT_H)
    }
    onConfirm({
      card: await encode(canvas),
      original: source && 'file' in source ? await downscaled(imgEl.current, img) : null,
      edit: { zoom, x: offset.x, y: offset.y, blur: blurOn, strength },
    })
  }

  return (
    <Dialog open={!!source} onOpenChange={(open) => !open && !saving && onCancel()}>
      <DialogContent className="max-w-[360px] gap-0 border border-white/[0.08] bg-astro-surface p-5 text-astro-text sm:max-w-[360px]">
        <DialogTitle className="font-display text-[28px] font-normal leading-none text-astro-text">{source && 'url' in source ? 'Edit your photo' : 'Position your photo'}</DialogTitle>
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
              crossOrigin="anonymous"
              alt=""
              draggable={false}
              onLoad={(e) => setImg({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={
                img
                  ? {
                      width: img.w * scale + blur * 4,
                      height: img.h * scale + blur * 4,
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                      filter: blur > 0 ? `blur(${blur}px)` : undefined,
                    }
                  : { opacity: 0 }
              }
            />
          )}
          {effect > 0 && <div className="pointer-events-none absolute inset-0" style={{ background: tintFor(effect) }} />}
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

        <div className="mt-3 flex items-center gap-3 text-xs font-bold text-astro-text-muted">
          <span id="photo-blur-label">Blur</span>
          <button
            type="button"
            role="switch"
            aria-checked={blurOn}
            aria-labelledby="photo-blur-label"
            onClick={() => setBlurOn((on) => !on)}
            className={cn(
              'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
              blurOn ? 'border-astro-accent/60 bg-astro-accent/70' : 'border-white/15 bg-white/[0.08] hover:bg-white/[0.14]',
            )}
          >
            <span
              className={cn('absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white transition-[left]', blurOn ? 'left-[18px]' : 'left-[2px]')}
            />
          </button>
          {blurOn && (
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="flex-1 accent-[#a63fff]"
              aria-label="Blur strength"
            />
          )}
        </div>

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
