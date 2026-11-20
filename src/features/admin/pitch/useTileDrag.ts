import { useEffect, useRef, useState } from 'react'

export type DropTarget = number | 'pool' | 'cancel'

type Pending = { id: string; label: string; x0: number; y0: number; touch: boolean; timer?: number; active: boolean }

const HOLD_MS = 220
const MOVE_PX = 6

function targetAt(x: number, y: number): DropTarget | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop]')
  if (!el) return null
  const v = el.dataset.drop
  return v === 'pool' || v === 'cancel' ? v : Number(v)
}

/** Pointer-based drag for player tiles. Mouse drags after a small move, touch after a short hold so the page still scrolls. */
export function useTileDrag(onDrop: (id: string, target: DropTarget) => void) {
  const pending = useRef<Pending | null>(null)
  const justDragged = useRef(false)
  const [drag, setDrag] = useState<{ id: string; label: string; x: number; y: number; over: DropTarget | null } | null>(null)
  const dropRef = useRef(onDrop)
  useEffect(() => {
    dropRef.current = onDrop
  })

  useEffect(() => {
    const activate = (p: Pending, x: number, y: number) => {
      p.active = true
      setDrag({ id: p.id, label: p.label, x, y, over: targetAt(x, y) })
      navigator.vibrate?.(10)
    }
    const end = () => {
      if (pending.current?.timer) clearTimeout(pending.current.timer)
      pending.current = null
      setDrag(null)
    }
    const move = (e: PointerEvent) => {
      const p = pending.current
      if (!p) return
      const far = Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > MOVE_PX
      if (!p.active) {
        if (!far) return
        if (p.touch) return end()
        activate(p, e.clientX, e.clientY)
      }
      setDrag((d) => d && { ...d, x: e.clientX, y: e.clientY, over: targetAt(e.clientX, e.clientY) })
    }
    const up = (e: PointerEvent) => {
      const p = pending.current
      if (p?.active) {
        justDragged.current = true
        setTimeout(() => (justDragged.current = false), 0)
        const target = targetAt(e.clientX, e.clientY)
        if (target !== null && target !== 'cancel') dropRef.current(p.id, target)
      }
      end()
    }
    // Stops the page scrolling under a touch drag; must be non-passive.
    const touchMove = (e: TouchEvent) => {
      if (pending.current?.active) e.preventDefault()
    }
    const startHold = (e: Event) => {
      const p = pending.current
      if (e.type === 'pointerdown' && p?.touch && !p.timer) p.timer = window.setTimeout(() => pending.current === p && activate(p, p.x0, p.y0), HOLD_MS)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && end()
    window.addEventListener('keydown', key)
    window.addEventListener('pointerdown', startHold)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', end)
    window.addEventListener('touchmove', touchMove, { passive: false })
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('pointerdown', startHold)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', end)
      window.removeEventListener('touchmove', touchMove)
    }
  }, [])

  const tileProps = (id: string, label: string, onTap: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return
      pending.current = { id, label, x0: e.clientX, y0: e.clientY, touch: e.pointerType === 'touch', active: false }
    },
    onClick: () => {
      if (justDragged.current) justDragged.current = false
      else onTap()
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  return { drag, tileProps }
}
