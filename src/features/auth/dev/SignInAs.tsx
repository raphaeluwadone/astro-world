import { useRouterState } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type DevPlayer = { id: string; nickname: string; full_name: string; is_admin: boolean; left_at: string | null; hasLogin: boolean }

async function signInAs(playerId: string | undefined, to: string) {
  const res = await fetch('/__dev/sign-in-as', { method: 'POST', body: JSON.stringify({ playerId }) })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error)
  await supabase.auth.signOut({ scope: 'local' })
  const { error } = await supabase.auth.verifyOtp({ token_hash: body.tokenHash, type: 'magiclink' })
  if (error) throw error
  window.location.assign(to)
}

/** Dev-only picker that signs you in as any player, or as a brand-new account. */
export function SignInAs({ redirectTo = '/', onRealSignIn }: { redirectTo?: string; onRealSignIn?: () => void }) {
  const [players, setPlayers] = useState<DevPlayer[]>()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    fetch('/__dev/sign-in-as')
      .then(async (r) => (r.ok ? setPlayers(await r.json()) : setError((await r.json()).error)))
      .catch(() => setError('Restart the dev server after adding SUPABASE_SERVICE_ROLE_KEY to .env.local.'))
  }, [])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? players?.filter((p) => `${p.nickname} ${p.full_name}`.toLowerCase().includes(q)) : players
    return [...(list ?? [])].sort((a, b) => Number(b.is_admin) - Number(a.is_admin) || Number(b.hasLogin) - Number(a.hasLogin))
  }, [players, query])

  function pick(id: string | undefined, to = redirectTo) {
    setBusy(id ?? 'new')
    setError(undefined)
    signInAs(id, to).catch((e: Error) => {
      setError(e.message)
      setBusy(undefined)
    })
  }

  return (
    <div className="flex max-h-[min(640px,85vh)] w-full max-w-[460px] flex-col rounded-[16px] border border-[rgba(74,222,128,0.45)] bg-astro-surface p-5 shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
      <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4ade80]">Dev only · local Supabase</div>
      <h2 className="mb-3 font-display text-[30px] leading-none text-astro-text">Sign in as</h2>
      <div className="mb-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a player"
          autoFocus
          className="min-w-0 flex-1 rounded-[10px] border border-border bg-astro-surface-2 px-3 py-2.5 text-[13px] text-astro-text outline-none focus:border-astro-accent"
        />
        <button
          type="button"
          onClick={() => pick(undefined, '/join')}
          disabled={!!busy}
          className="shrink-0 rounded-[10px] border border-[rgba(74,222,128,0.45)] px-3 text-[12px] font-extrabold text-[#4ade80] disabled:opacity-40"
        >
          {busy === 'new' ? 'Making…' : 'New account'}
        </button>
      </div>
      {error && <div className="mb-3 rounded-lg bg-[rgba(224,72,63,0.14)] px-3 py-2 text-[12px] text-[#ff8a80]">{error}</div>}
      <div className="-mx-2 min-h-0 flex-1 overflow-y-auto">
        {!players && !error && <div className="px-2 py-6 text-center text-[12.5px] text-astro-text-dim">Loading players…</div>}
        {shown.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!!busy}
            onClick={() => pick(p.id)}
            className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left hover:bg-white/[0.04] disabled:opacity-50"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-extrabold text-astro-text">{p.nickname}</div>
              <div className="truncate text-[11px] text-astro-text-dim">{p.full_name}</div>
            </div>
            {p.is_admin && <Tag colour="#38bdf8">Admin</Tag>}
            {p.left_at && <Tag colour="#e0483f">Left</Tag>}
            {!p.hasLogin && <Tag colour="#6d7496">No login yet</Tag>}
            {busy === p.id && <span className="text-[11px] text-astro-text-dim">…</span>}
          </button>
        ))}
      </div>
      <div className="mt-3 text-[11px] leading-snug text-astro-text-dim">
        Picking someone with no login links a dev one to them, so they count as claimed.
        {onRealSignIn && (
          <>
            {' '}
            <button type="button" onClick={onRealSignIn} className="font-bold text-astro-accent-soft underline">
              Use the real sign-in
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Tag({ colour, children }: { colour: string; children: string }) {
  return (
    <span className="shrink-0 rounded-md border px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.08em]" style={{ color: colour, borderColor: `${colour}66` }}>
      {children}
    </span>
  )
}

// Screens tied to the account you're leaving; land on Home instead.
const STUCK = new Set(['/join', '/onboarding', '/pending-approval'])

/** Floating button inside the app for switching who you are. */
export function DevSwitcher() {
  const [open, setOpen] = useState(false)
  const path = useRouterState({ select: (s) => s.location.pathname })
  if (path === '/login') return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[60px] right-4 z-50 rounded-full border border-[rgba(74,222,128,0.5)] bg-astro-surface px-3.5 py-2 text-[11px] font-extrabold text-[#4ade80] shadow-[0_8px_20px_rgba(0,0,0,0.4)] max-md:bottom-[96px]"
      >
        Dev: switch player
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <SignInAs redirectTo={STUCK.has(path) ? '/' : window.location.pathname + window.location.search} />
        </div>
      )}
    </>
  )
}
