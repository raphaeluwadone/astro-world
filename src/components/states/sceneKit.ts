import type { CSSProperties } from 'react'

export const LINE = '#2c3c74'
export const DIM = '#3c4570'
export const ACCENT = '#a63fff'
export const SOFT = '#c589ff'
export const GOLD = '#f2a93b'
export const INK = '#eef0f9'
export const CARD = '#111a33'

export const anim = (animation: string, origin?: string): CSSProperties => ({ animation, transformOrigin: origin })
export const own = (animation: string): CSSProperties => ({ animation, transformBox: 'fill-box', transformOrigin: 'center' })
