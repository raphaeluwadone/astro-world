import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)))

function parse(position: string | null): [number, number] {
  const m = /^(\d+)% (\d+)%$/.exec(position ?? '')
  return m ? [Number(m[1]), Number(m[2])] : [50, 50]
}

/** Cover image the writer can drag (or nudge with arrow keys) to choose what the crop shows. */
export function CoverPositioner({ src, position, onChange }: { src: string; position: string | null; onChange: (position: string) => void }) {
  const [[x, y], setXY] = useState(() => parse(position))
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ px: number; py: number; x: number; y: number; spanX: number; spanY: number } | null>(null)

  const commit = (nx: number, ny: number) => {
    setXY([nx, ny])
    onChange(`${nx}% ${ny}%`)
  }

  const onPointerDown = (e: PointerEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const scale = Math.max(img.clientWidth / img.naturalWidth, img.clientHeight / img.naturalHeight)
    // How far the image overhangs the frame; with no overhang on an axis there is nothing to move.
    const spanX = img.naturalWidth * scale - img.clientWidth
    const spanY = img.naturalHeight * scale - img.clientHeight
    drag.current = { px: e.clientX, py: e.clientY, x, y, spanX, spanY }
    img.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  const onPointerMove = (e: PointerEvent<HTMLImageElement>) => {
    const d = drag.current
    if (!d) return
    const nx = d.spanX > 1 ? clamp(d.x - ((e.clientX - d.px) / d.spanX) * 100) : d.x
    const ny = d.spanY > 1 ? clamp(d.y - ((e.clientY - d.py) / d.spanY) * 100) : d.y
    setXY([nx, ny])
  }

  const onPointerUp = () => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    commit(x, y)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLImageElement>) => {
    const step = e.shiftKey ? 10 : 2
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
    const m = moves[e.key]
    if (!m) return
    e.preventDefault()
    commit(clamp(x + m[0]), clamp(y + m[1]))
  }

  return (
    <>
      <img
        src={src}
        alt=""
        draggable={false}
        tabIndex={0}
        aria-label="Cover image. Drag or use the arrow keys to reposition."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        style={{ objectPosition: `${x}% ${y}%` }}
        className={`aspect-[16/9] w-full touch-none select-none object-cover focus:outline-none focus-visible:ring-2 focus-visible:ring-astro-accent ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      />
      <span
        className={`pointer-events-none absolute left-3 top-3 rounded-lg bg-astro-bg/85 px-2.5 py-1 text-[11.5px] font-bold text-astro-text-muted backdrop-blur transition-opacity ${dragging ? 'opacity-0' : 'opacity-100'}`}
      >
        Drag to reposition
      </span>
    </>
  )
}
