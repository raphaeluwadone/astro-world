import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project values.',
  )
}

// This client always carries the current user's session (or none, for
// anonymous access), so every query goes through Postgres RLS as that
// user. Do not introduce a second client backed by a service-role key
// for "convenience" — that would bypass RLS, which is the actual
// enforcement mechanism behind vote anonymity. See project memory /
// the design handoff for why that matters here specifically.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
