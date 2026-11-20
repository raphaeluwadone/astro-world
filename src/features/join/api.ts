import { supabase } from '@/lib/supabase'

export interface FreeName {
  id: string
  nickname: string
  full_name: string
}

/** Roster names nobody has claimed yet. */
export async function fetchFreeNames(): Promise<FreeName[]> {
  const { data, error } = await supabase
    .from('players')
    .select('id, nickname, full_name')
    .is('user_id', null)
    .is('left_at', null)
    .order('nickname')
  if (error) throw error
  return data ?? []
}

export async function checkGroupCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('group_code_ok', { p_code: code })
  if (error) throw error
  return data === true
}

export interface JoinInput {
  code: string
  /** A free roster name to claim; null adds a new player from nickname and fullName. */
  playerId: string | null
  nickname: string
  fullName: string
  instagram: string
  birthdayMonth: number | null
  birthdayDay: number | null
}

export async function joinGroup(input: JoinInput): Promise<string> {
  const { data, error } = await supabase.rpc('join_group', {
    p_code: input.code,
    p_player_id: input.playerId ?? undefined,
    p_nickname: input.nickname,
    p_full_name: input.fullName,
    p_instagram: input.instagram,
    p_birthday_month: input.birthdayMonth ?? undefined,
    p_birthday_day: input.birthdayDay ?? undefined,
  })
  if (error) throw error
  return data
}

export interface MyClaim {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  player_id: string
  players: { nickname: string }
}

/** Claims made before joining went code-based can still be waiting on an admin. */
export async function fetchMyLatestClaim(userId: string): Promise<MyClaim | null> {
  const { data, error } = await supabase
    .from('player_claims')
    .select('id, status, player_id, players!player_claims_player_id_fkey (nickname)')
    .eq('claimant_user_id', userId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as unknown as MyClaim | null
}

const CODE_KEY = 'astro:group-code'

/** The code is kept for the few seconds between sign-up and picking a name. */
export const groupCodeMemory = {
  get(): string {
    try {
      return sessionStorage.getItem(CODE_KEY) ?? ''
    } catch {
      return ''
    }
  },
  set(code: string) {
    try {
      sessionStorage.setItem(CODE_KEY, code)
    } catch {
      // Storage blocked: the join screen asks for the code again.
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(CODE_KEY)
    } catch {
      // Nothing to clear.
    }
  },
}
