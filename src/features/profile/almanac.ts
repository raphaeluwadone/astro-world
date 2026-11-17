import { supabase } from '@/lib/supabase'

export interface AlmanacMonth {
  g: number
  a: number
  dotm?: number
}

export interface PlayerAlmanac {
  write_up: string | null
  facts: string[]
  months: Record<string, AlmanacMonth>
}

export const ALMANAC_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'] as const

export async function fetchPlayerAlmanac(playerId: string): Promise<PlayerAlmanac | null> {
  const { data, error } = await supabase.from('player_almanac').select('write_up, facts, months').eq('player_id', playerId).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { write_up: data.write_up, facts: data.facts ?? [], months: (data.months ?? {}) as unknown as Record<string, AlmanacMonth> }
}

export type InlinePart = { text: string; style: 'plain' | 'bold' | 'italic' }

/** Splits the write-up's **bold** and _italic_ markers into parts, so it can be rendered without HTML. */
export function inlineParts(text: string): InlinePart[] {
  return text
    .split(/(\*\*[^*]+\*\*|_[^_]+_)/)
    .filter(Boolean)
    .map((s) =>
      s.startsWith('**') && s.endsWith('**') && s.length > 4
        ? { text: s.slice(2, -2), style: 'bold' as const }
        : s.startsWith('_') && s.endsWith('_') && s.length > 2
          ? { text: s.slice(1, -1), style: 'italic' as const }
          : { text: s, style: 'plain' as const },
    )
}

/** Goals and assists for each month, January to November, with zeros filled in. */
export function monthSeries(months: Record<string, AlmanacMonth>) {
  return ALMANAC_MONTHS.map((label, i) => ({ label, g: months[String(i + 1)]?.g ?? 0, a: months[String(i + 1)]?.a ?? 0, dotm: months[String(i + 1)]?.dotm }))
}
