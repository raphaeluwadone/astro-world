import type { CupQuarter } from './api'

export interface RecapRow {
  club: string
  p: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  gd: number
  pts: number
  cs: number
}

export interface RecapPlayer {
  player_id: string | null
  nickname: string
  club: string
  v: number
}

export interface CupRecap {
  champion: string
  champion_note?: string
  format?: string
  totals?: { g: number; a: number; cs: number; games: number }
  table: RecapRow[]
  mvp?: { player_id: string | null; nickname: string | null; club: string; tag: string; text: string }
  scorers: RecapPlayer[]
  assisters: RecapPlayer[]
}

/** The recorded recap of a cup from before the app, or null for a cup with real fixtures. */
export function cupRecap(cup: Pick<CupQuarter, 'recap'> | null | undefined): CupRecap | null {
  const r = cup?.recap as Partial<CupRecap> | null | undefined
  if (!r || typeof r.champion !== 'string' || !Array.isArray(r.table)) return null
  return { ...r, champion: r.champion, table: r.table, scorers: r.scorers ?? [], assisters: r.assisters ?? [] }
}
